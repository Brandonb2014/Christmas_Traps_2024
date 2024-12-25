// npm run dev to run with nodemon
import express from 'express';
import { getPlayers, getPlayerByName, setPlayerDifficultyLevel, clearPlayerDifficultyLevels, clearPlayerDifficultyLevel, getPlayerMissions, saveNewScan, insertPlayerProgress, getPlayerMissionDetails, setPlayerMissionId, getPlayerScans, clearPlayerScans, checkPlayerProgress, updatePlayerProgress, clearPlayerData, insertPlayerMissions, updatePlayerMission, updatePlayerMissionsComplete, getPlayerMissionsComplete, updatePlayerUnlockedBasement, resetGame } from './database.js';

const app = express();
app.set("view engine", "ejs");

const PORT = process.env.PORT || 3000;

// Body Parser Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
    const { id } = req.query;

    if (!!id) {
        const setPlayerDifficultyLevelResult = await setPlayerDifficultyLevel(id, null);
    }
    const players = await getPlayers();
    res.render("index.ejs", {
        players,
    });
});

// Express will fall back to the public folder.
app.use(express.static("public"));

app.get("/player/:name", async (req, res) => {
    const { name } = req.params;
    if (!name) return res.status(400).json({ msg: 'Player Name is required' });

    const player = await getPlayerByName(name);
    return res.send(player);
});

app.get("/players", async (req, res) => {
    const players = await getPlayers();
    res.send(players);
});

app.get("/navigateToIntro", async (req, res) => {
    res.render("intro.ejs", {});
});

app.get("/clearPlayerDifficultyLevels", async (req, res) => {
    const result = await clearPlayerDifficultyLevels();
    res.send(result);
});

app.get("/clearPlayerDifficultyLevel/:name", async (req, res) => {
    const { name } = req.params;
    
    const result = await clearPlayerDifficultyLevel(name);
    res.send(result);
});

app.get("/dashboard", async (req, res) => {
    const { id, difficulty } = req.query;

    // Reset the mission_id of the player back to 0.
    const setPlayerMissionIdResponse = await setPlayerMissionId(id, 0);

    const missions = await getPlayerMissions(id);

    const missionsComplete = await getPlayerMissionsComplete(id);

    res.render("dashboard.ejs", {
        id, difficulty, missions, missionsComplete,
    });
});

app.get("/mission", async (req, res) => {
    const { id, missionId, difficulty, mission, audio_url } = req.query;

    const setPlayerMissionIdResponse = await setPlayerMissionId(id, missionId);

    const missionDetails = await getPlayerMissionDetails(id, missionId);

    res.render("mission.ejs", {
        id, missionId, missionDetails, difficulty, mission, audio_url,
    });
});

app.get("/basementMission", async (req, res) => {
    const { id, missionId } = req.query;

    const setPlayerMissionIdResponse = await setPlayerMissionId(id, missionId);

    res.render("basementMission.ejs", {
        id, missionId,
    });

});

app.get("/largeDoor", async (req, res) => {
    res.render("largeDoor.ejs", {});
});

app.get("/checkNewScans", async (req, res) => {
    const { id, missionId } = req.query;

    const getPlayerScansResponse = await getPlayerScans(id);

    if (!!getPlayerScansResponse && !!getPlayerScansResponse[0]?.sensor_id) {
        const {sensor_id} = getPlayerScansResponse[0];

        if (!!getPlayerScansResponse && !!sensor_id && !!missionId) {
            const clearPlayerScansResponse = await clearPlayerScans(id);

            // checkPlayerProgress grabs from the player_mission_details table using the player_id, sensor_id, and mission_id
            const checkPlayerProgressResponse = await checkPlayerProgress(id, sensor_id, missionId);
            if (!!checkPlayerProgressResponse) {
                // if data comes back, then we know that the player hit a sensor that is in their mission and we need to update the progress
                const updatePlayerProgressResponse = await updatePlayerProgress(id, sensor_id, missionId);

                return res.send(checkPlayerProgressResponse);
            }
            if (sensor_id == 11 && missionId != 11) {
                return res.status(200).json({ msg: "Need Spell" });
            } else if (sensor_id == 11 && missionId == 11) {
                const updatePlayerUnlockedBasementResponse = await updatePlayerUnlockedBasement(id, true);
                return res.status(200).json({ msg: "Door unlocked" });
            }
            return res.status(200).json({ msg: "No player progress response" });
        }
        return res.status(200).json({ msg: "Missing sensor_id or mission_id" });
    }
    return res.status(200).json({ msg: "No player scans" });
});

app.get("/checkActivePlayers", async (req, res) => {
    const players = await getPlayers();
    return res.send(players);
});

app.get("/resetGame", async (req, res) => {
    const resetGameResponse = await resetGame();
    return res.send(resetGameResponse);
})

app.get("/checkMissionProgress", async (req, res) => {
    const { id, missionId } = req.query;

    if (!id || !missionId) return res.status(400).json({ msg: 'Missing playerId or missionId' });

    const missionDetails = await getPlayerMissionDetails(id, missionId);
    let missionComplete = true;
    for (let i = 0; i < missionDetails.length; i++) {
        if (missionDetails[i].display && !missionDetails[i].is_collected) {
            missionComplete = false;
        }
    }

    if (missionComplete) {
        const updatePlayerMissionResponse = await updatePlayerMission(id, missionId);
    }

    const playerMissions = await getPlayerMissions(id);
    let allPlayerMissionsComplete = true;
    for (let i = 0; i < playerMissions.length; i++) {
        if (!playerMissions[i].is_complete) {
            allPlayerMissionsComplete = false;
        }
    }

    if (allPlayerMissionsComplete) {
        const updatePlayerMissionsCompleteResponse = await updatePlayerMissionsComplete(id, true);
    }
    return res.status(200).json({ msg: 'Mission updated' }); 
});

app.post('/api', async (req, res) => {
    const { playerId, sensorId } = req.query;

    if (!playerId || !sensorId) return res.status(400).json({ msg: 'Missing playerId or sensorId' });

    const result = await saveNewScan(playerId, sensorId);

    switch (playerId) {
        case '87':
            console.log('Evelyn just hit sensor', sensorId, new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
            break;
        case '5d':
            console.log('Shelby just hit sensor', sensorId, new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
            break;
        case '9d':
            console.log('Carson just hit sensor', sensorId, new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
            break;
        case '7d':
            console.log('Emerson just hit sensor', sensorId, new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
            break;
        case '3d':
            console.log('Ollie just hit sensor', sensorId, new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
            break;
        case '2b':
            console.log('Grayson just hit sensor', sensorId, new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
            break;
        case 'a3':
            console.log('Guest - Pink Emerald just hit sensor', sensorId, new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
            break;
        case '91':
            console.log('Guest - Crescent Moon just hit sensor', sensorId, new Date().toLocaleString("en-US", {timeZone: "America/Denver"}));
            break;
        default:
            break;
    }

    return res.json({ playerId: `${playerId}`, sensorId: `${sensorId}`});
});

app.post('/message', async (req, res) => {
	const { chipId, message } = req.body;

	if (!chipId || !message) return res.status(400).json({ msg: 'Missing chipId or message' });

	console.log(new Date().toLocaleString("en-US", {timeZone: "America/Denver"}), ' - New message from chip #:', chipId, "|", message);
	return res.status(200).json({ msg: 'Success' });
});

const server = app.listen(PORT, () => console.log(`App is now running! Navigate to localhost:${PORT} to view front end`));

server.keepAliveTimeout = 120 * 1000;
server.headersTimeout = 120 * 1000;
