import os
import json
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv
import pandas as pd
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

load_dotenv()

db_login = f"""host={os.environ.get('DB_HOST')}
               port={os.environ.get('DB_PORT')}
               dbname={os.environ.get('DB_NAME')}
               user={os.environ.get('DB_USER')}
               password={os.environ.get('DB_PASS')}"""
print(db_login)

app = Flask(__name__)
app.config['DEBUG'] = True 
app.config['JSON_AS_ASCII'] = False


CORS(app)

@app.route("/")
def root():
    return {"message": "Draw-Modify-App / PostgreSQL"}

@app.route("/create-sights", methods=['POST'])
def create_sights():
    content = request.get_json()
    uuid = content['uuid']

    art = content['art']
    geometry = json.dumps(content['geometry'], ensure_ascii=False)

    try:
        with psycopg2.connect(db_login) as connection:
            connection.autocommit = True
            cursor = connection.cursor()
            if content['geometry']:
               cursor.execute(f"""INSERT INTO sights VALUES('{uuid}',
                              ST_GeomFromGeoJSON('{geometry}'), '{art}');""") 
            else:
                return {'message': "Geometrie existiert nicht"}
    except psycopg2.DatabaseError as error:
        return {'message':str(error)}
    return {'message': 'Geometrien erfolgreich gespeichert'}

@app.route("/create-seat", methods=['POST'])
def create_seat():
    content = request.get_json()
    uuid = content['uuid']
    seated = False
    nametag = content['nametag']
    geometry = json.dumps(content['geometry'], ensure_ascii=False)

    try:
        with psycopg2.connect(db_login) as connection:
            connection.autocommit = True
            cursor = connection.cursor()
            if content['geometry']:
               cursor.execute(f"INSERT INTO seats VALUES('{uuid}', ST_GeomFromGeoJSON('{geometry}'),{seated},'{nametag}');")
            else:
                return {'message': "Geometrie existiert nicht"}
    except psycopg2.DatabaseError as error:
        return {'message':str(error)}
    return {'message': 'Geometrien erfolgreich gespeichert'}

@app.route("/get_sights", methods=['GET'])
def get_sights():
    try:
        with psycopg2.connect(db_login) as connection:
            cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT uuid, ST_AsGeoJSON(geom) as geometry, art FROM sights")
            sights = cursor.fetchall()

            # Format the results as GeoJSON
            features = []
            for sight in sights:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(sight['geometry']),
                    "properties": {
                        "uuid": sight['uuid'],
                        "art": sight['art']
                    }
                }
                features.append(feature)

            geojson = {
                "type": "FeatureCollection",
                "features": features
            }

            return jsonify(geojson)
    except psycopg2.DatabaseError as error:
        return {'message': str(error)}, 500
    
@app.route("/get_seats", methods=['GET'])
def get_seats():
    try:
        with psycopg2.connect(db_login) as connection:
            cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT uuid, seated, nametag, ST_AsGeoJSON(geom) as geometry FROM seats")
            seats = cursor.fetchall()

            # Format the results as GeoJSON
            features = []
            for seat in seats:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(seat['geometry']),
                    "properties": {
                        "uuid": seat['uuid'],
                        "seated": seat['seated'],
                        "nametag": seat['nametag'],
                    }
                }
                features.append(feature)

            geojson = {
                "type": "FeatureCollection",
                "features": features
            }

            return jsonify(geojson)
    except psycopg2.DatabaseError as error:
        return {'message': str(error)}, 500
    
@app.route("/update_seat", methods=['POST'])
def update_seat():

    data = request.get_json()
    uuid = data.get('uuid')
    seated = data.get('seated')

    if not uuid or seated is None:
        return jsonify({"message": "Missing required data"}), 400

    try:
        with psycopg2.connect(db_login) as connection:
            cursor = connection.cursor()
            sql = "UPDATE seats SET seated = %s WHERE uuid = %s RETURNING uuid;"
            cursor.execute(sql, (seated, uuid))
            updated_uuid = cursor.fetchone()
            
            if updated_uuid:
                connection.commit()
                return jsonify({"message": "Seat updated successfully", "uuid": updated_uuid[0]}), 200
            else:
                return jsonify({"message": "Seat not found"}), 404

    except psycopg2.DatabaseError as error:
        connection.rollback()
        return jsonify({'message': str(error)}), 500
    
@app.route("/delete_seat", methods=['DELETE'])
def delete_seat():
    data = request.get_json()
    uuid = data.get('uuid')
    title = data.get('title')

    if not uuid:
        return jsonify({"message": "Missing UUID"}), 400

    try:
        with psycopg2.connect(db_login) as connection:
            cursor = connection.cursor()
            sql = f"DELETE FROM {title} WHERE uuid = %s RETURNING uuid;"
            cursor.execute(sql, (uuid,))
            deleted_uuid = cursor.fetchone()
            
            if deleted_uuid:
                connection.commit()
                return jsonify({"message": "Seat deleted successfully", "uuid": deleted_uuid[0]}), 200
            else:
                return jsonify({"message": "Seat not found"}), 404

    except psycopg2.DatabaseError as error:
        connection.rollback()
        return jsonify({'message': str(error)}), 500

@app.route("/create-areas", methods=['POST'])
def create_areas():
    content = request.get_json()
    uuid = content['uuid']
    geometry = json.dumps(content['geometry'], ensure_ascii=False)

    try:
        with psycopg2.connect(db_login) as connection:
            connection.autocommit = True
            cursor = connection.cursor()
            if content['geometry']:
               cursor.execute(f"INSERT INTO areas VALUES('{uuid}', ST_GeomFromGeoJSON('{geometry}'));")
            else:
                return {'message': "Geometrie existiert nicht"}
    except psycopg2.DatabaseError as error:
        return {'message':str(error)}
    return {'message': 'Geometrien erfolgreich gespeichert'}

@app.route("/get_areas", methods=['GET'])
def get_areas():
    try:
        with psycopg2.connect(db_login) as connection:
            cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT uuid, ST_AsGeoJSON(geom) as geometry FROM areas")
            areas = cursor.fetchall()

            # Format the results as GeoJSON
            features = []
            for area in areas:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(area['geometry']),
                    "properties": {
                        "uuid": area['uuid'],
                    }
                }
                features.append(feature)

            geojson = {
                "type": "FeatureCollection",
                "features": features
            }
            return jsonify(geojson)
    except psycopg2.DatabaseError as error:
        return {'message': str(error)}, 500
@app.route("/create-path", methods=['POST'])
def create_path():
    content = request.get_json()
    uuid = content['uuid']
    geometry = json.dumps(content['geometry'], ensure_ascii=False)
    try:
        with psycopg2.connect(db_login) as connection:
            connection.autocommit = True
            cursor = connection.cursor()
            if content['geometry']:
               cursor.execute(f"""INSERT INTO paths VALUES('{uuid}',
                              ST_GeomFromGeoJSON('{geometry}'));""") 
            else:
                return {'message': "Geometrie existiert nicht"}
    except psycopg2.DatabaseError as error:
        return {'message':str(error)}
    return {'message': 'Geometrien erfolgreich gespeichert'}

@app.route("/get_paths", methods=['GET'])
def get_paths():
    try:
        with psycopg2.connect(db_login) as connection:
            cursor = connection.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
            cursor.execute("SELECT uuid, ST_AsGeoJSON(geom) as geometry FROM paths")
            paths= cursor.fetchall()

            # Format the results as GeoJSON
            features = []
            for path in paths:
                feature = {
                    "type": "Feature",
                    "geometry": json.loads(path['geometry']),
                    "properties": {
                        "uuid": path['uuid'],
                    }
                }
                features.append(feature)

            geojson = {
                "type": "FeatureCollection",
                "features": features
            }

            return jsonify(geojson)
    except psycopg2.DatabaseError as error:
        return {'message': str(error)}, 500
   

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=os.environ.get('API_PORT'))