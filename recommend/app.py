#python
# Purpose: Flask API for the recommendation system, using the 'test' database with enhanced JSON parsing and logging to handle malformed JSON in the /recommend endpoint.
from flask import Flask, request, jsonify
from pymongo import MongoClient
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np
import os
from datetime import datetime
from bson.objectid import ObjectId
from dotenv import load_dotenv
import json

# Load environment variables from backend .env
try:
    load_dotenv('D:/room-rental-platform/room-rental-platform/.env', encoding='utf-8')
except Exception as e:
    print(f"Error loading .env file: {str(e)}")

app = Flask(__name__)

# MongoDB connection
mongo_uri = os.getenv('MONGO_URI', 'mongodb+srv://bibekpandit28:nX0R3J6ayxNWYKRZ@roomrental.hxqjlfb.mongodb.net/test?retryWrites=true&w=majority&appName=RoomRental')
try:
    client = MongoClient(mongo_uri)
    db = client['test']
    rooms_collection = db['rooms']
    client.server_info()
    print(f"Connected to MongoDB: {mongo_uri}")
    print(f"Database: {db.name}, Collection: {rooms_collection.name}")
except Exception as e:
    print(f"MongoDB connection error: {str(e)}")
    raise

@app.route('/')
def home():
    return jsonify({'message': 'Recommendation System API is running'})

@app.route('/debug/rooms', methods=['GET'])
def debug_rooms():
    try:
        room_count = rooms_collection.count_documents({})
        rooms = list(rooms_collection.find().limit(5))
        for room in rooms:
            room['_id'] = str(room['_id'])
            room['category'] = str(room['category'])
            room['landlord'] = str(room['landlord'])
        print(f"Debug: Found {room_count} rooms")
        return jsonify({
            'message': f'Found {room_count} rooms',
            'sample': rooms
        })
    except Exception as e:
        print(f"Debug error: {str(e)}")
        return jsonify({'message': f'Debug error: {str(e)}'}), 500

def train_recommendations():
    try:
        print("Fetching rooms...")
        rooms = list(rooms_collection.find())
        print(f"Found {len(rooms)} rooms")
        if not rooms:
            return {'message': 'No rooms found for training'}

        room_features = []
        room_ids = []
        for room in rooms:
            category = db['categories'].find_one({'_id': room['category']})
            category_name = category['name'] if category else ''
            price = room['price'] / 100000
            feature_str = f"{price} {category_name} {room['location']['address']}"
            room_features.append(feature_str)
            room_ids.append(str(room['_id']))

        vectorizer = TfidfVectorizer()
        feature_matrix = vectorizer.fit_transform(room_features)
        similarity_matrix = cosine_similarity(feature_matrix)

        recommendations_collection = db['recommendations']
        recommendations_collection.drop()
        for i, room_id in enumerate(room_ids):
            similar_rooms = [
                {'roomId': room_ids[j], 'score': float(similarity_matrix[i][j])}
                for j in range(len(room_ids)) if i != j and similarity_matrix[i][j] > 0.1
            ]
            similar_rooms = sorted(similar_rooms, key=lambda x: x['score'], reverse=True)[:10]
            recommendations_collection.insert_one({
                'roomId': room_id,
                'similarRooms': similar_rooms,
                'lastUpdated': datetime.now()
            })

        print("Training completed successfully")
        return {'message': 'Recommendations trained successfully'}
    except Exception as e:
        print(f"Training error: {str(e)}")
        return {'message': f'Training error: {str(e)}'}

@app.route('/train', methods=['POST'])
def train():
    result = train_recommendations()
    return jsonify(result)

@app.route('/recommend', methods=['POST'])
def recommend():
    try:
        print("Received /recommend request")
        # Log request headers and raw data
        print(f"Request headers: {dict(request.headers)}")
        raw_data = request.data.decode('utf-8', errors='ignore')
        print(f"Raw request data: {raw_data}")
        if not raw_data:
            print("Error: Empty request body")
            return jsonify({'message': 'Empty request body'}), 400

        # Try parsing JSON with Flask
        try:
            data = request.get_json(silent=False)
            print(f"Flask parsed JSON: {data}")
        except Exception as e:
            print(f"Flask JSON parsing error: {str(e)}")
            # Fallback to manual JSON parsing
            try:
                data = json.loads(raw_data)
                print(f"Manually parsed JSON: {data}")
            except json.JSONDecodeError as je:
                print(f"Manual JSON parsing error: {str(je)}")
                return jsonify({'message': f'Invalid JSON: {str(je)}'}), 400

        user_id = data.get('userId')
        if not user_id:
            print("Error: userId is missing")
            return jsonify({'message': 'userId is required'}), 400

        try:
            user = db['users'].find_one({'_id': ObjectId(user_id)})
        except Exception as e:
            print(f"Error parsing userId: {str(e)}")
            return jsonify({'message': f'Invalid userId: {str(e)}'}), 400

        if not user:
            print(f"Error: User not found for userId: {user_id}")
            return jsonify({'message': 'User not found'}), 404

        print(f"User found: {user}")
        preferences = user.get('preferences', {})
        viewed_rooms = user.get('viewedRooms', [])
        query = {'isAvailable': True}
        if preferences.get('maxPrice'):
            query['price'] = {'$lte': float(preferences['maxPrice'])}
        if preferences.get('preferredCategories'):
            query['category'] = {'$in': [ObjectId(cat) for cat in preferences['preferredCategories']]}
        if preferences.get('preferredLocations'):
            query['location.address'] = {'$regex': '|'.join(preferences['preferredLocations']), '$options': 'i'}

        print(f"Querying rooms with: {query}")
        rooms = list(rooms_collection.find(query).limit(10))
        print(f"Found {len(rooms)} rooms")

        if viewed_rooms:
            viewed_room_ids = [str(r) for r in viewed_rooms]
            print(f"Fetching recommendations for viewed rooms: {viewed_room_ids}")
            recommendations = list(db['recommendations'].find({'roomId': {'$in': viewed_room_ids}}))
            similar_room_ids = [
                sr['roomId'] for rec in recommendations for sr in rec['similarRooms'] if sr['score'] > 0.1
            ]
            similar_room_ids = sorted(set(similar_room_ids), key=lambda x: sum(
                r['score'] for rec in recommendations for r in rec['similarRooms'] if r['roomId'] == x
            ), reverse=True)[:10]
            additional_rooms = list(rooms_collection.find({
                '_id': {'$in': [ObjectId(id) for id in similar_room_ids], '$nin': [r['_id'] for r in rooms]},
                'isAvailable': True
            }))
            print(f"Found {len(additional_rooms)} additional rooms")
            rooms = rooms + additional_rooms[:5]

        for room in rooms:
            room['_id'] = str(room['_id'])
            room['category'] = str(room['category'])
            room['landlord'] = str(room['landlord'])

        print(f"Returning {len(rooms[:5])} rooms")
        return jsonify(rooms[:5])
    except Exception as e:
        print(f"Recommendation error: {str(e)}")
        return jsonify({'message': f'Recommendation error: {str(e)}'}), 500

if __name__ == '__main__':
    app.run(port=5001)