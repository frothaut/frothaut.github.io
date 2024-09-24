-- Active: 1716897057722@@geo-postgres22.local.hcuhh.de@5432@db_hdh805@public
-- change table names

-- Point
DROP TABLE IF EXISTS sights;
CREATE TABLE IF NOT EXISTS sights
(
    uuid UUID PRIMARY KEY,
    geom GEOMETRY,
    art VARCHAR(265),
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Point
DROP TABLE IF EXISTS seats;
CREATE TABLE IF NOT EXISTS seats
(
    uuid UUID PRIMARY KEY,
    geom GEOMETRY,
    seated BOOLEAN,
    nametag VARCHAR(256),
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Linestring
DROP TABLE IF EXISTS draw_modify_linestring;
CREATE TABLE IF NOT EXISTS draw_modify_linestring
(
    uuid UUID PRIMARY KEY,
    geom GEOMETRY,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Polygon
DROP TABLE IF EXISTS areas;
CREATE TABLE IF NOT EXISTS areas
(
    uuid UUID PRIMARY KEY,
    geom GEOMETRY,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

SELECT * FROM draw_modify_polygon;
-- log in
DROP TABLE IF EXISTS sights;
CREATE TABLE IF NOT EXISTS sights
(
    uuid UUID PRIMARY KEY,
    vorname VARCHAR(265),
    nachname VARCHAR(265),
    email VARCHAR(265),
    passw VARCHAR(265),
);
DROP TABLE IF EXISTS paths;
CREATE TABLE IF NOT EXISTS paths
(
    uuid UUID PRIMARY KEY,
    geom GEOMETRY,
    modified TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
