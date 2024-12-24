import mysql from 'mysql2'

const pool = mysql.createPool({
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'traps_2023'
}).promise();

export async function resetGame() {
    const resetPlayers = await pool.query(`
        UPDATE players
        set mission_id = 0,
            difficulty = null,
            missions_complete = 0,
            unlocked_basement = 0;
    `);

    const clearPlayerMissions = await pool.query(`
        DELETE FROM player_missions;
    `);

    const clearPlayerMissionDetails = await pool.query(`
        DELETE FROM player_mission_details;
    `);

    const clearNewScans = await pool.query(`
        DELETE FROM new_scans;
    `);
}

export async function getPlayers() {
    const [rows] = await pool.query(`
        SELECT *
        FROM players
        ORDER BY sort_order;
    `);
    return rows;
}

export async function getPlayerById(id) {
    const [row] = await pool.query(`
        SELECT *
        FROM players
        WHERE id = ?;
    `, [id]);
    return row[0];
}

export async function getPlayerSelectedMission(id) {
    const [row] = await pool.query(`
        SELECT mission_id
        FROM players
        WHERE id = ?;
    `, [id]);
    return row[0];
}

export async function getPlayerByName(name) {
    const [row] = await pool.query(`
        SELECT *
        FROM players
        WHERE name = ?;
    `, [name]);
    return row[0];
}

export async function getPlayerMissions(playerId) {
    const [row] = await pool.query(`
        SELECT *
        FROM player_missions
        WHERE player_id = ?
        ORDER BY mission_id;
    `, [playerId]);
    return row;
}

export async function getMissions(difficulty) {
    const [row] = await pool.query(`
        SELECT *
        FROM missions
        WHERE difficulty = ?
        ORDER BY id;
    `, [difficulty]);
    return row;
}

export async function getMissionDetails(difficulty) {
    const [row] = await pool.query(`
        SELECT *
        FROM mission_details
        WHERE difficulty = ?
        ORDER BY id;
    `, [difficulty]);
    return row;
}

export async function setPlayerDifficultyLevel(player_id, difficulty) {
    const [row] = await pool.query(`
        UPDATE players
        SET difficulty = ?
        WHERE id = ?;
    `, [difficulty, player_id]);
    return row;
}

export async function setPlayerMissionId(player_id, mission_id) {
    const [row] = await pool.query(`
        UPDATE players
        SET mission_id = ?
        WHERE id = ?;
    `, [parseInt(mission_id), player_id]);
    return row;
}

export async function updatePlayerMissionsComplete(player_id, status) {
    const [row] = await pool.query(`
        UPDATE players
        SET missions_complete = ?
        WHERE id = ?;
    `, [status, player_id]);
    return row;
}

export async function getPlayerMissionsComplete(player_id) {
    const [row] = await pool.query(`
        SELECT missions_complete
        FROM players
        WHERE id = ?;
    `, [player_id]);
    return row[0];
}

export async function updatePlayerUnlockedBasement(player_id, status) {
    const [row] = await pool.query(`
        UPDATE players
        SET unlocked_basement = ?
        WHERE id = ?;
    `, [status, player_id]);
    return row;
}

export async function clearPlayerDifficultyLevels() {
    const [row] = await pool.query(`
        UPDATE players
        SET difficulty = null;
    `);
    return row;
}

export async function clearPlayerDifficultyLevel(name) {
    const [row] = await pool.query(`
        UPDATE players
        SET difficulty = null
        WHERE name = ?;
    `, [name]);
    return await getPlayerByName(name);
}

export async function clearPlayerScans(playerId) {
    const result = await pool.query(`
        DELETE FROM new_scans
        WHERE player_id = ?;
    `, [playerId]);
    return result;
}

export async function clearPlayerData(playerId) {
    const deletePlayerMissionsResult = await pool.query(`
        DELETE FROM player_missions
        WHERE player_id = ?;
    `, [playerId]);
    
    const deletePlayerMissionDetailsResult = await pool.query(`
        DELETE FROM player_mission_details
        WHERE player_id = ?;
    `, [playerId]);

    return deletePlayerMissionDetailsResult;
}

export async function saveNewScan(playerId, sensorId) {
    const getPlayerSelectedMissionResult = await getPlayerSelectedMission(playerId);
    try {
        if (getPlayerSelectedMissionResult?.mission_id ?? 0 != 0) {
            const clearPlayerScansResult = await clearPlayerScans(playerId);
            const [row] = await pool.query(`
            INSERT INTO new_scans (player_id, sensor_id, mission_id)
            VALUES (?, ?, ?);
            `, [playerId, parseInt(sensorId), parseInt(getPlayerSelectedMissionResult.mission_id)]);
            return row;
        }
    } catch (error) {
        console.log('error saving new scan:', error);
        return "";
    }
}

export async function getPlayerScans(playerId) {
    const result = await pool.query(`
        SELECT * FROM new_scans
        WHERE player_id = ?;
    `, [playerId]);
    return result[0];
}

export async function insertPlayerProgress(playerId, difficulty) {
    const missionDetails = await getMissionDetails(difficulty);

    if (difficulty == "easy") {
        //  1 snowman
        //  2 candy cane
        //  3 present
        //  4 snowman
        //  5 present
        //  6 candy cane
        //  7 present
        //  8 snowman
        //  9 candy cane
        // 10 present
        const sensor_ids = [1, 4, 8, 2, 6, 9, 3, 5, 10, 7];
        for (let i = 0; i < missionDetails.length; i++) {
            const [row] = await pool.query(`
            INSERT INTO player_mission_details (player_id, sensor_id, mission_id, item, item_id, img_url, audio_url, display, is_collected)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [playerId, parseInt(sensor_ids[i]), parseInt(missionDetails[i].mission_id), missionDetails[i].item, parseInt(missionDetails[i].id), missionDetails[i].img_url, missionDetails[i].audio_url, missionDetails[i].display, false]);
        }
    } else {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const shuffle1 = await shuffle(arr);
        const shuffle2 = await shuffle(arr);
        const shuffle3 = await shuffle(arr);
        const shuffle4 = await shuffle(arr);
        const shuffle5 = await shuffle(arr);
        const shuffle6 = await shuffle(arr);
        const shuffle7 = await shuffle(arr);

        const fullArray = shuffle1.concat(shuffle2, shuffle3, shuffle4, shuffle5, shuffle6, shuffle7);
        
        for (let i = 0; i < missionDetails.length; i++) {
            const [row] = await pool.query(`
            INSERT INTO player_mission_details (player_id, sensor_id, mission_id, item, item_id, img_url, audio_url, display, is_collected)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);
            `, [playerId, parseInt(fullArray[i]), parseInt(missionDetails[i].mission_id), missionDetails[i].item, parseInt(missionDetails[i].id), missionDetails[i].img_url, missionDetails[i].audio_url, missionDetails[i].display, false]);
        }
    }
    return "Done";
}

export async function insertPlayerMissions(playerId, difficulty) {
    const playerMissions = await getMissions(difficulty);

    for (let i = 0; i < playerMissions.length; i++) {
        const [row] = await pool.query(`
        INSERT INTO player_missions (player_id, mission_id, item, img_url, audio_url, is_complete)
        VALUES (?, ?, ?, ?, ?, ?);
        `, [playerId, parseInt(playerMissions[i].id), playerMissions[i].item, playerMissions[i].img_url, playerMissions[i].audio_url, false]);
    }

    return "Done";
}

function shuffle(array) {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
  
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}

export async function updatePlayerProgress(playerId, sensorId, missionId) {
    const [row] = await pool.query(`
        UPDATE player_mission_details
        SET is_collected = 1
        WHERE player_id = ?
        AND sensor_id = ?
        AND mission_id = ?;
    `, [playerId, parseInt(sensorId), parseInt(missionId)]);
    return row;
}

export async function updatePlayerMission(playerId, missionId) {
    const [row] = await pool.query(`
        UPDATE player_missions
        SET is_complete = 1
        WHERE player_id = ?
        AND mission_id = ?;
    `, [playerId, parseInt(missionId)]);
    return row;
}

export async function getPlayerMissionDetails(playerId, missionId) {
    const [row] = await pool.query(`
        SELECT *
        FROM player_mission_details
        WHERE player_id = ?
        AND mission_id = ?
        ORDER BY item_id;
    `, [playerId, parseInt(missionId)]);
    return row;
}

export async function checkPlayerProgress(playerId, sensorId, missionId) {
    if (!!playerId && !!sensorId && !!missionId) {
        const [row] = await pool.query(`
            SELECT *
            FROM player_mission_details
            WHERE player_id = ?
            AND sensor_id = ?
            AND mission_id = ?;
        `, [playerId, parseInt(sensorId), parseInt(missionId)]);
        return row[0];
    }
}