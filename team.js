const leagueID =
    "1380159618264621056";


const urlParams =
    new URLSearchParams(
        window.location.search
    );


const userID =
    urlParams.get("user");
const matchupView =
    window.location.hash === "#team-matchup";

const teamProfile =
    document.querySelector(".team-profile");

const teamStats =
    document.querySelector(".team-stats");

const matchupSection =
    document.querySelector(".team-week-section");

const rosterSection =
    document.querySelector(".team-roster-section");


if (matchupView) {

    document
    .querySelector(".team-page")
    ?.classList.add("matchup-only-page");

    if (teamProfile) {
        teamProfile.style.display = "none";
    }

    if (teamStats) {
        teamStats.style.display = "none";
    }

    if (rosterSection) {
        rosterSection.style.display = "none";
    }

    if (matchupSection) {
        matchupSection.style.display = "block";
    }

} else {

    // TEAM PAGE:
    // hide weekly head-to-head matchup

    if (matchupSection) {
        matchupSection.style.display = "none";
    }

}

let nflPlayers = {};

Promise.all([

    fetch(
        `https://api.sleeper.app/v1/league/${leagueID}/users`
    ).then(response => response.json()),

    fetch(
        `https://api.sleeper.app/v1/league/${leagueID}/rosters`
    ).then(response => response.json()),

    fetch(
        `https://api.sleeper.app/v1/league/${leagueID}`
    ).then(response => response.json()),

    fetch(
        "https://api.sleeper.app/v1/players/nfl"
    ).then(response => response.json())

])

.then(([users, rosters, league, players]) => {


    nflPlayers = players;


    const user =
        users.find(
            user =>
                user.user_id === userID
        );


    if (!user) {

        document.getElementById(
            "team-page-name"
        ).textContent =
            "Team Not Found";

        return;

    }


    const roster =
        rosters.find(
            roster =>
                roster.owner_id === userID
        );


    const teamName =
        user.metadata?.team_name ||
        user.display_name;


    document.getElementById(
        "team-page-name"
    ).textContent =
        teamName;


    document.getElementById(
        "team-page-manager"
    ).textContent =
        `Manager: ${user.display_name}`;


    document.title =
        `${teamName} | TOFER'S TAVERN`;


    displayTeamAvatar(user);


    if (roster) {

    displayTeamStats(roster);

    displayWeeklyMatchup(
        roster,
        users,
        rosters,
        league
    );

    displayTeamRoster(roster, league);

}

})

.catch(error => {

    console.error(
        "Error loading team page:",
        error
    );

});

function displayTeamAvatar(user) {

    const avatarContainer =
        document.getElementById(
            "team-page-avatar"
        );


    if (user.avatar) {

        avatarContainer.innerHTML = `

            <img
                class="team-page-avatar"
                src="https://sleepercdn.com/avatars/thumbs/${user.avatar}"
                alt="${user.display_name}"
            >

        `;

    } else {

        avatarContainer.innerHTML = `

            <div class="team-page-avatar avatar-fallback">

                ${user.display_name
                    .charAt(0)
                    .toUpperCase()}

            </div>

        `;

    }

}

function displayTeamStats(roster) {


    const wins =
        roster.settings?.wins || 0;


    const losses =
        roster.settings?.losses || 0;


    const points =
        (roster.settings?.fpts || 0) +
        (
            (roster.settings?.fpts_decimal || 0)
            / 100
        );


    document.getElementById(
        "team-wins"
    ).textContent =
        wins;


    document.getElementById(
        "team-losses"
    ).textContent =
        losses;


    document.getElementById(
        "team-points"
    ).textContent =
        points.toFixed(2);

}

function displayTeamRoster(roster, league) {

    const rosterContainer =
        document.getElementById("team-page-roster");

    rosterContainer.innerHTML = "";


    const startingPositions =
        league.roster_positions.filter(
            position => position !== "BN"
        );


    const starters =
        roster.starters || [];


    const starterIDs =
        new Set(
            starters.map(playerID => String(playerID))
        );


    const benchPlayers =
        (roster.players || []).filter(
            playerID =>
                !starterIDs.has(String(playerID))
        );


    // STARTING LINEUP

    const startersTitle =
        document.createElement("h3");

    startersTitle.classList.add(
        "roster-group-title"
    );

    startersTitle.textContent =
        "Starting Lineup";

    rosterContainer.appendChild(
        startersTitle
    );


    startingPositions.forEach(
        (slot, index) => {

            const playerID =
                starters[index];

            const player =
                nflPlayers[playerID];


            if (!player) {

                const emptyRow =
                    document.createElement("div");

                emptyRow.classList.add(
                    "player-row"
                );

                emptyRow.innerHTML = `

                    <div class="lineup-player">

                        <span class="lineup-slot">
                            ${slot}
                        </span>

                        <span class="player-name">
                            Empty Slot
                        </span>

                    </div>

                `;

                rosterContainer.appendChild(
                    emptyRow
                );

                return;
            }


            const playerRow =
                createPlayerRow(
                    player,
                    playerID,
                    slot
                );

            rosterContainer.appendChild(
                playerRow
            );

        }
    );


    // BENCH

    const benchTitle =
        document.createElement("h3");

    benchTitle.classList.add(
        "roster-group-title",
        "bench-title"
    );

    benchTitle.textContent =
        "Bench";

    rosterContainer.appendChild(
        benchTitle
    );


    benchPlayers.forEach(playerID => {

        const player =
            nflPlayers[playerID];

        if (!player) {
            return;
        }


        const playerRow =
            createPlayerRow(
                player,
                playerID,
                "BN"
            );

        rosterContainer.appendChild(
            playerRow
        );

    });

}

function createPlayerRow(player, playerID, lineupSlot) {

    const playerRow =
        document.createElement("div");

    playerRow.classList.add("player-row");


    let playerName;

    let imageHTML;


    if (player.position === "DEF") {

        playerName =
            `${player.team} Defense`;

        imageHTML = `
            <div class="player-headshot defense-logo">
                ${player.team}
            </div>
        `;

    } else {

        playerName =
            player.full_name ||
            "Unknown Player";

        imageHTML = `
            <img
                class="player-headshot"
                src="https://sleepercdn.com/content/nfl/players/${playerID}.jpg"
                alt="${playerName}"
                onerror="this.style.display='none'"
            >
        `;

    }


    const nflTeam =
        player.team || "FA";


    playerRow.innerHTML = `

        <div class="lineup-player">

            <span class="lineup-slot">
                ${lineupSlot}
            </span>

            ${imageHTML}

            <div class="player-info">

                <span class="player-name">
                    ${playerName}
                </span>

                <span class="player-nfl-team">
                    ${nflTeam}
                </span>

            </div>

        </div>


        <div class="player-details">

            <span class="player-position">
                ${player.position}
            </span>

            <span class="player-rank">
                ${player.position}--
            </span>

        </div>

    `;


    return playerRow;

}

function displayWeeklyMatchup(
    roster,
    users,
    rosters,
    league
) {

    const currentWeek =
        league.settings.leg;


    document.getElementById(
        "team-week-title"
    ).textContent =
        `Week ${currentWeek} Matchup`;


    fetch(
        `https://api.sleeper.app/v1/league/${leagueID}/matchups/${currentWeek}`
    )

        .then(response => response.json())

        .then(matchups => {

            const myMatchup =
                matchups.find(
                    team =>
                        team.roster_id ===
                        roster.roster_id
                );


            if (!myMatchup) {

                document.getElementById(
                    "team-week-matchup"
                ).innerHTML =
                    "<p>No matchup found.</p>";

                return;

            }


            const opponentMatchup =
                matchups.find(
                    team =>
                        team.matchup_id ===
                        myMatchup.matchup_id &&
                        team.roster_id !==
                        roster.roster_id
                );


            if (!opponentMatchup) {

                document.getElementById(
                    "team-week-matchup"
                ).innerHTML =
                    "<p>No opponent this week.</p>";

                return;

            }


            const opponentRoster =
                rosters.find(
                    team =>
                        team.roster_id ===
                        opponentMatchup.roster_id
                );


            const myUser =
                users.find(
                    user =>
                        user.user_id ===
                        roster.owner_id
                );


            const opponentUser =
                users.find(
                    user =>
                        user.user_id ===
                        opponentRoster.owner_id
                );


            const myTeamName =
                myUser?.metadata?.team_name ||
                myUser?.display_name ||
                "Your Team";


            const opponentTeamName =
                opponentUser?.metadata?.team_name ||
                opponentUser?.display_name ||
                "Opponent";


            const myScore =
                myMatchup.points || 0;


            const opponentScore =
                opponentMatchup.points || 0;

	let myTeamClass = "";
let opponentTeamClass = "";


if (myScore > opponentScore) {

    myTeamClass = "matchup-leading";

} else if (opponentScore > myScore) {

    opponentTeamClass = "matchup-leading";

}


            const myAvatar =
                getMatchupAvatar(myUser);


            const opponentAvatar =
                getMatchupAvatar(opponentUser);


            const myLineup =
                buildMatchupLineup(
                    myMatchup,
                    roster,
                    league
                );


            const opponentLineup =
                buildMatchupLineup(
                    opponentMatchup,
                    opponentRoster,
                    league
                );

const myBench =
    buildMatchupBench(
        myMatchup,
        roster
    );


const opponentBench =
    buildMatchupBench(
        opponentMatchup,
        opponentRoster
    );

            document.getElementById(
    "team-week-matchup"
).innerHTML = `

    <div class="team-page-matchup">

        <div class="weekly-team ${myTeamClass}">

            ${myAvatar}

            <h3>
                ${myTeamName}
            </h3>

            <div class="weekly-score">
                ${myScore.toFixed(2)}
            </div>

        </div>


        <div class="weekly-vs">
            VS
        </div>


        <div class="weekly-team ${opponentTeamClass}">

            ${opponentAvatar}

            <h3>
                ${opponentTeamName}
            </h3>

            <div class="weekly-score">
                ${opponentScore.toFixed(2)}
            </div>

        </div>

    </div>


    <div class="matchup-lineups">

        <div class="matchup-lineup">

            <h3>
                ${myTeamName}
            </h3>

            <div class="matchup-group-label">
                Starting Lineup
            </div>

            ${myLineup}

            <div class="matchup-group-label matchup-bench-label">
                Bench
            </div>

            ${myBench}

        </div>


        <div class="matchup-lineup">

            <h3>
                ${opponentTeamName}
            </h3>

            <div class="matchup-group-label">
                Starting Lineup
            </div>

            ${opponentLineup}

            <div class="matchup-group-label matchup-bench-label">
                Bench
            </div>

            ${opponentBench}

        </div>

    </div>

`;

        })

        .catch(error => {

            console.error(
                "Error loading team matchup:",
                error
            );

        });

}

function getMatchupAvatar(user) {

    if (user?.avatar) {

        return `

            <img
                class="weekly-avatar"
                src="https://sleepercdn.com/avatars/thumbs/${user.avatar}"
                alt="${user.display_name}"
            >

        `;

    }


    const initial =
        user?.display_name
            ?.charAt(0)
            .toUpperCase() || "?";


    return `

        <div class="weekly-avatar avatar-fallback">
            ${initial}
        </div>

    `;

}

function buildMatchupLineup(
    matchupTeam,
    roster,
    league
) {

    const startingPositions =
        league.roster_positions.filter(
            position => position !== "BN"
        );


    const starters =
        matchupTeam.starters ||
        roster.starters ||
        [];


    let lineupHTML = "";


    startingPositions.forEach(
        (slot, index) => {

            const playerID =
                starters[index];


            const player =
                nflPlayers[playerID];


            if (!player) {

                lineupHTML += `

                    <div class="matchup-lineup-row">

                        <span class="matchup-slot">
                            ${slot}
                        </span>

                        <div class="matchup-player-photo defense-logo">
                            --
                        </div>

                        <div class="matchup-player-info">

                            <strong>
                                Empty Slot
                            </strong>

                        </div>

                        <span class="matchup-player-score">
                            0.00
                        </span>

                    </div>

                `;

                return;

            }


            let playerName;


            if (player.position === "DEF") {

                playerName =
                    `${player.team} Defense`;

            } else {

                playerName =
                    player.full_name ||
                    "Unknown Player";

            }


            const playerPoints =
                matchupTeam.players_points?.[playerID] || 0;


            let playerImage;


            if (player.position === "DEF") {

                playerImage = `

                    <div class="matchup-player-photo defense-logo">
                        ${player.team}
                    </div>

                `;

            } else {

                playerImage = `

                    <img
                        class="matchup-player-photo"
                        src="https://sleepercdn.com/content/nfl/players/${playerID}.jpg"
                        alt="${playerName}"
                        onerror="this.style.display='none'"
                    >

                `;

            }


            lineupHTML += `

                <div class="matchup-lineup-row">

                    <span class="matchup-slot">
                        ${slot}
                    </span>

                    ${playerImage}

                    <div class="matchup-player-info">

                        <strong>
                            ${playerName}
                        </strong>

                        <span>
                            ${player.team || "FA"}
                            •
                            ${player.position}
                        </span>

                    </div>

                    <span class="matchup-player-score">
                        ${playerPoints.toFixed(2)}
                    </span>

                </div>

            `;

        }
    );


    return lineupHTML;

}function buildMatchupLineup(
    matchupTeam,
    roster,
    league
) {

    const startingPositions =
        league.roster_positions.filter(
            position => position !== "BN"
        );


    const starters =
        matchupTeam.starters ||
        roster.starters ||
        [];


    let lineupHTML = "";


    startingPositions.forEach(
        (slot, index) => {

            const playerID =
                starters[index];


            const player =
                nflPlayers[playerID];


            if (!player) {

                lineupHTML += `

                    <div class="matchup-lineup-row">

                        <span class="matchup-slot">
                            ${slot}
                        </span>

                        <div class="matchup-player-photo defense-logo">
                            --
                        </div>

                        <div class="matchup-player-info">

                            <strong>
                                Empty Slot
                            </strong>

                        </div>

                        <span class="matchup-player-score">
                            0.00
                        </span>

                    </div>

                `;

                return;

            }


            let playerName;


            if (player.position === "DEF") {

                playerName =
                    `${player.team} Defense`;

            } else {

                playerName =
                    player.full_name ||
                    "Unknown Player";

            }


            const playerPoints =
                matchupTeam.players_points?.[playerID] || 0;


            let playerImage;


            if (player.position === "DEF") {

                playerImage = `

                    <div class="matchup-player-photo defense-logo">
                        ${player.team}
                    </div>

                `;

            } else {

                playerImage = `

                    <img
                        class="matchup-player-photo"
                        src="https://sleepercdn.com/content/nfl/players/${playerID}.jpg"
                        alt="${playerName}"
                        onerror="this.style.display='none'"
                    >

                `;

            }


            lineupHTML += `

                <div class="matchup-lineup-row">

                    <span class="matchup-slot">
                        ${slot}
                    </span>

                    ${playerImage}

                    <div class="matchup-player-info">

                        <strong>
                            ${playerName}
                        </strong>

                        <span>
                            ${player.team || "FA"}
                            •
                            ${player.position}
                        </span>

                    </div>

                    <span class="matchup-player-score">
                        ${playerPoints.toFixed(2)}
                    </span>

                </div>

            `;

        }
    );


    return lineupHTML;

}

function buildMatchupBench(
    matchupTeam,
    roster
) {

    const starters =
        matchupTeam.starters ||
        roster.starters ||
        [];


    const starterIDs =
        new Set(
            starters.map(
                playerID =>
                    String(playerID)
            )
        );


    const reserveIDs =
        new Set(
            (roster.reserve || [])
                .map(
                    playerID =>
                        String(playerID)
                )
        );


    const benchIDs =
        (roster.players || [])
            .filter(playerID => {

                const id =
                    String(playerID);


                return (
                    !starterIDs.has(id) &&
                    !reserveIDs.has(id)
                );

            });


    let benchHTML = "";


    benchIDs.forEach(playerID => {

        const player =
            nflPlayers[playerID];


        if (!player) {
            return;
        }


        let playerName;


        if (player.position === "DEF") {

            playerName =
                `${player.team} Defense`;

        } else {

            playerName =
                player.full_name ||
                "Unknown Player";

        }


        const playerPoints =
            matchupTeam
                .players_points
                ?.[playerID] || 0;


        let playerImage;


        if (player.position === "DEF") {

            playerImage = `

                <div class="matchup-player-photo defense-logo">
                    ${player.team}
                </div>

            `;

        } else {

            playerImage = `

                <img
                    class="matchup-player-photo"
                    src="https://sleepercdn.com/content/nfl/players/${playerID}.jpg"
                    alt="${playerName}"
                    onerror="this.style.display='none'"
                >

            `;

        }


        benchHTML += `

            <div class="matchup-lineup-row">

                <span class="matchup-slot bench-matchup-slot">
                    BN
                </span>

                ${playerImage}


                <div class="matchup-player-info">

                    <strong>
                        ${playerName}
                    </strong>

                    <span>
                        ${player.team || "FA"}
                        •
                        ${player.position}
                    </span>

                </div>


                <span class="matchup-player-score">
                    ${playerPoints.toFixed(2)}
                </span>

            </div>

        `;

    });


    return benchHTML;

}
