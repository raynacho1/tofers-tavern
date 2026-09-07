const currentLeagueID =
    "1380159618264621056";


async function fetchJSON(url) {

    const response =
        await fetch(url);


    if (!response.ok) {

        throw new Error(
            `Request failed: ${response.status}`
        );

    }


    return response.json();

}



async function getLeagueChain(startLeagueID) {

    const leagues = [];

    let leagueID =
        startLeagueID;


    let safetyCounter = 0;


    while (
        leagueID &&
        leagueID !== "0" &&
        safetyCounter < 20
    ) {

        const league =
            await fetchJSON(
                `https://api.sleeper.app/v1/league/${leagueID}`
            );


        leagues.push(league);


        leagueID =
            league.previous_league_id;


        safetyCounter++;

    }


    return leagues;

}



async function loadLeagueHistory() {

    const container =
        document.getElementById(
            "champions-container"
        );


    try {

        const leagues =
            await getLeagueChain(
                currentLeagueID
            );


        container.innerHTML = "";


        for (const league of leagues) {


            const [
                users,
                rosters,
                winnersBracket
            ] =
                await Promise.all([

                    fetchJSON(
                        `https://api.sleeper.app/v1/league/${league.league_id}/users`
                    ),

                    fetchJSON(
                        `https://api.sleeper.app/v1/league/${league.league_id}/rosters`
                    ),

                    fetchJSON(
                        `https://api.sleeper.app/v1/league/${league.league_id}/winners_bracket`
                    )

                ]);


            let championTeam =
                "Season In Progress";


            let championManager =
                "";


            let championRecord =
                "";


            let championPoints =
                "";


            const championship =
                winnersBracket.find(
                    matchup =>
                        matchup.p === 1 &&
                        matchup.w
                );


            if (championship) {


                const championRoster =
                    rosters.find(
                        roster =>
                            roster.roster_id ===
                            championship.w
                    );


                if (championRoster) {


                    const championUser =
                        users.find(
                            user =>
                                user.user_id ===
                                championRoster.owner_id
                        );


                    championTeam =
                        championUser
                            ?.metadata
                            ?.team_name ||

                        championUser
                            ?.display_name ||

                        "Unknown Champion";


                    championManager =
                        championUser
                            ?.display_name ||
                        "Unknown Manager";


                    const wins =
                        championRoster
                            .settings
                            ?.wins || 0;


                    const losses =
                        championRoster
                            .settings
                            ?.losses || 0;


                    const points =
                        (
                            championRoster
                                .settings
                                ?.fpts || 0
                        )
                        +
                        (
                            (
                                championRoster
                                    .settings
                                    ?.fpts_decimal || 0
                            ) / 100
                        );


                    championRecord =
                        `${wins}-${losses}`;


                    championPoints =
                        `${points.toFixed(2)} pts`;

                }

            }


            const seasonCard =
                document.createElement(
                    "div"
                );


            seasonCard.classList.add(
                "champion-card"
            );


            if (championship) {

                seasonCard.innerHTML = `

                    <div class="champion-year">
                        ${league.season}
                    </div>

                    <div class="champion-trophy">
   		     &#127942;
		    </div>

                    <div class="champion-info">

                        <div class="champion-label">
                            League Champion
                        </div>

                        <div class="champion-team">
                            ${championTeam}
                        </div>

                        <div class="champion-manager">
                            ${championManager}
                        </div>

                    </div>

                    <div class="champion-stats">

                        <strong>
                            ${championRecord}
                        </strong>

                        <span>
                            ${championPoints}
                        </span>

                    </div>

                `;

            } else {

                seasonCard.innerHTML = `

                    <div class="champion-year">
                        ${league.season}
                    </div>

                    <div class="champion-trophy">
   		 &#127944;
		</div>

                    <div class="champion-info">

                        <div class="champion-label">
                            Current Season
                        </div>

                        <div class="champion-team">
                            Season In Progress
                        </div>

                        <div class="champion-manager">
                            The Tavern crown is still up for grabs.
                        </div>

                    </div>

                `;

            }


            container.appendChild(
                seasonCard
            );

        }


        if (leagues.length === 1) {

            const notice =
                document.createElement(
                    "div"
                );


            notice.classList.add(
                "history-notice"
            );


            notice.textContent =
                "No earlier Sleeper seasons are linked to this league.";


            container.appendChild(
                notice
            );

        }

    }

    catch (error) {

        console.error(
            "Error loading league history:",
            error
        );


        container.innerHTML = `

            <div class="history-notice">

                Unable to load league history.

            </div>

        `;

    }

}



loadLeagueHistory();

async function loadRecordBook() {

    const container =
        document.getElementById(
            "record-book-container"
        );


    try {

        const leagues =
            await getLeagueChain(
                currentLeagueID
            );


        const completedLeagues =
            leagues.filter(
                league =>
                    league.status === "complete"
            );


        if (completedLeagues.length === 0) {

            container.innerHTML = `

                <div class="history-notice">

                    No completed seasons are available yet.

                </div>

            `;

            return;

        }


        let highestWeeklyScore = null;

        let lowestWeeklyScore = null;

        let biggestBlowout = null;

        let closestGame = null;

        let bestRecord = null;

        let seasonPointsLeader = null;
	
	let badBeat = null;

	let miraclePint = null;

	let playoffBarFight = null;

	let playoffMassacre = null;

	let longestWinStreak = null;

	let longestLoseStreak = null;
        
	for (const league of completedLeagues) {


            const [
                users,
                rosters
            ] =
                await Promise.all([

                    fetchJSON(
                        `https://api.sleeper.app/v1/league/${league.league_id}/users`
                    ),

                    fetchJSON(
                        `https://api.sleeper.app/v1/league/${league.league_id}/rosters`
                    )

                ]);


            const usersByID = {};


            users.forEach(user => {

                usersByID[user.user_id] =
                    user;

            });


            const rostersByID = {};


            rosters.forEach(roster => {

                rostersByID[
                    roster.roster_id
                ] = roster;

            });


            function getTeamInfo(rosterID) {

                const roster =
                    rostersByID[
                        rosterID
                    ];


                if (!roster) {

                    return {

                        teamName:
                            `Team ${rosterID}`,

                        managerName:
                            "Unknown"

                    };

                }


                const user =
                    usersByID[
                        roster.owner_id
                    ];


                return {

                    teamName:

                        user
                            ?.metadata
                            ?.team_name ||

                        user
                            ?.display_name ||

                        `Team ${rosterID}`,

                    managerName:

                        user
                            ?.display_name ||

                        "Unknown"

                };

            }


            // BEST REGULAR-SEASON RECORD
            // AND MOST SEASON POINTS


            rosters.forEach(roster => {


                const team =
                    getTeamInfo(
                        roster.roster_id
                    );


                const wins =
                    roster.settings?.wins || 0;


                const losses =
                    roster.settings?.losses || 0;


                const games =
                    wins + losses;


                const winPercentage =
                    games > 0
                        ? wins / games
                        : 0;


                const points =
                    (roster.settings?.fpts || 0)
                    +
                    (
                        (
                            roster.settings
                                ?.fpts_decimal || 0
                        ) / 100
                    );


                if (
                    !bestRecord ||

                    winPercentage >
                    bestRecord.winPercentage ||

                    (
                        winPercentage ===
                        bestRecord.winPercentage &&

                        wins >
                        bestRecord.wins
                    )
                ) {

                    bestRecord = {

                        teamName:
                            team.teamName,

                        managerName:
                            team.managerName,

                        wins:
                            wins,

                        losses:
                            losses,

                        winPercentage:
                            winPercentage,

                        season:
                            league.season

                    };

                }


                if (
                    !seasonPointsLeader ||
                    points >
                    seasonPointsLeader.points
                ) {

                    seasonPointsLeader = {

                        teamName:
                            team.teamName,

                        managerName:
                            team.managerName,

                        points:
                            points,

                        season:
                            league.season

                    };

                }

            });


            // FIND HOW MANY REGULAR-SEASON
            // WEEKS THIS LEAGUE HAD


            const playoffStartWeek =
   	        Number(
      		  league.settings
           		 ?.playoff_week_start ||
      		  15
    );


            const regularSeasonWeeks =
    		playoffStartWeek - 1;


            const weekRequests = [];


            for (
                let week = 1;
                week <= regularSeasonWeeks;
                week++
            ) {

                weekRequests.push(

                    fetchJSON(
                        `https://api.sleeper.app/v1/league/${league.league_id}/matchups/${week}`
                    )

                );

            }


            const weeklyMatchups =
                await Promise.all(
                    weekRequests
                );

	// WINNING AND LOSING STREAKS

const streaks = {};


rosters.forEach(roster => {

    streaks[roster.roster_id] = {

        currentWins: 0,
        currentLosses: 0

    };

});


weeklyMatchups.forEach(
    (matchups, index) => {

        const week =
            index + 1;


        const matchupGroups = {};


        matchups.forEach(team => {

            if (
                team.matchup_id == null
            ) {
                return;
            }


            if (
                !matchupGroups[
                    team.matchup_id
                ]
            ) {

                matchupGroups[
                    team.matchup_id
                ] = [];

            }


            matchupGroups[
                team.matchup_id
            ].push(team);

        });


        Object.values(
            matchupGroups
        ).forEach(matchup => {


            if (
                matchup.length !== 2
            ) {
                return;
            }


            const teamA =
                matchup[0];

            const teamB =
                matchup[1];


            const scoreA =
                Number(teamA.points) || 0;

            const scoreB =
                Number(teamB.points) || 0;


            if (
                scoreA <= 0 ||
                scoreB <= 0
            ) {
                return;
            }


            let winnerID;
            let loserID;


            if (scoreA > scoreB) {

                winnerID =
                    teamA.roster_id;

                loserID =
                    teamB.roster_id;

            } else if (scoreB > scoreA) {

                winnerID =
                    teamB.roster_id;

                loserID =
                    teamA.roster_id;

            } else {

                streaks[
                    teamA.roster_id
                ].currentWins = 0;

                streaks[
                    teamA.roster_id
                ].currentLosses = 0;

                streaks[
                    teamB.roster_id
                ].currentWins = 0;

                streaks[
                    teamB.roster_id
                ].currentLosses = 0;

                return;

            }


            // WINNER

            streaks[
                winnerID
            ].currentWins++;

            streaks[
                winnerID
            ].currentLosses = 0;


            const winnerInfo =
                getTeamInfo(
                    winnerID
                );


            if (
                !longestWinStreak ||
                streaks[winnerID]
                    .currentWins >
                longestWinStreak.length
            ) {

                longestWinStreak = {

                    teamName:
                        winnerInfo.teamName,

                    managerName:
                        winnerInfo.managerName,

                    length:
                        streaks[
                            winnerID
                        ].currentWins,

                    endingWeek:
                        week,

                    season:
                        league.season

                };

            }


            // LOSER

            streaks[
                loserID
            ].currentLosses++;

            streaks[
                loserID
            ].currentWins = 0;


            const loserInfo =
                getTeamInfo(
                    loserID
                );


            if (
                !longestLoseStreak ||
                streaks[loserID]
                    .currentLosses >
                longestLoseStreak.length
            ) {

                longestLoseStreak = {

                    teamName:
                        loserInfo.teamName,

                    managerName:
                        loserInfo.managerName,

                    length:
                        streaks[
                            loserID
                        ].currentLosses,

                    endingWeek:
                        week,

                    season:
                        league.season

                };

            }

        });

    }
);
            weeklyMatchups.forEach(
                (matchups, index) => {


                    const week =
                        index + 1;


                    // HIGH / LOW WEEKLY SCORE


                    matchups.forEach(team => {


                        const score =
                            Number(
                                team.points
                            ) || 0;


                        // Ignore zeroes so empty
                        // weeks don't become records

                        if (score <= 0) {
                            return;
                        }


                        const teamInfo =
                            getTeamInfo(
                                team.roster_id
                            );


                        if (
                            !highestWeeklyScore ||
                            score >
                            highestWeeklyScore.score
                        ) {

                            highestWeeklyScore = {

                                teamName:
                                    teamInfo.teamName,

                                managerName:
                                    teamInfo.managerName,

                                score:
                                    score,

                                week:
                                    week,

                                season:
                                    league.season

                            };

                        }


                        if (
                            !lowestWeeklyScore ||
                            score <
                            lowestWeeklyScore.score
                        ) {

                            lowestWeeklyScore = {

                                teamName:
                                    teamInfo.teamName,

                                managerName:
                                    teamInfo.managerName,

                                score:
                                    score,

                                week:
                                    week,

                                season:
                                    league.season

                            };

                        }

                    });


                    // GROUP TEAMS INTO MATCHUPS


                    const matchupGroups = {};


                    matchups.forEach(team => {


                        if (
                            team.matchup_id == null
                        ) {
                            return;
                        }


                        if (
                            !matchupGroups[
                                team.matchup_id
                            ]
                        ) {

                            matchupGroups[
                                team.matchup_id
                            ] = [];

                        }


                        matchupGroups[
                            team.matchup_id
                        ].push(team);

                    });


                    Object.values(
                        matchupGroups
                    ).forEach(matchup => {


                        if (
                            matchup.length !== 2
                        ) {
                            return;
                        }


                        const teamA =
                            matchup[0];


                        const teamB =
                            matchup[1];


                        const scoreA =
                            Number(
                                teamA.points
                            ) || 0;


                        const scoreB =
                            Number(
                                teamB.points
                            ) || 0;


                        if (
                            scoreA <= 0 ||
                            scoreB <= 0
                        ) {
                            return;
                        }


                        const margin =
                            Math.abs(
                                scoreA -
                                scoreB
                            );


                        const infoA =
                            getTeamInfo(
                                teamA.roster_id
                            );


                        const infoB =
                            getTeamInfo(
                                teamB.roster_id
                            );


                        let winner;

                        let loser;


                        if (scoreA >= scoreB) {

                            winner = {

                                ...infoA,
                                score: scoreA

                            };


                            loser = {

                                ...infoB,
                                score: scoreB

                            };

                        } else {

                            winner = {

                                ...infoB,
                                score: scoreB

                            };


                            loser = {

                                ...infoA,
                                score: scoreA

                            };

                        }

			// THE BAD BEAT
// Most points scored in a loss

if (
    !badBeat ||
    loser.score > badBeat.score
) {

    badBeat = {

        teamName:
            loser.teamName,

        managerName:
            loser.managerName,

        score:
            loser.score,

        winnerName:
            winner.teamName,

        week:
            week,

        season:
            league.season

    };

}


// THE MIRACLE PINT
// Fewest points scored in a win

if (
    !miraclePint ||
    winner.score < miraclePint.score
) {

    miraclePint = {

        teamName:
            winner.teamName,

        managerName:
            winner.managerName,

        score:
            winner.score,

        loserName:
            loser.teamName,

        week:
            week,

        season:
            league.season

    };

}
                        // BIGGEST BLOWOUT


                        if (
                            !biggestBlowout ||
                            margin >
                            biggestBlowout.margin
                        ) {

                            biggestBlowout = {

                                winner:
                                    winner,

                                loser:
                                    loser,

                                margin:
                                    margin,

                                week:
                                    week,

                                season:
                                    league.season

                            };

                        }


                        // CLOSEST GAME


                        if (
                            !closestGame ||
                            margin <
                            closestGame.margin
                        ) {

                            closestGame = {

                                winner:
                                    winner,

                                loser:
                                    loser,

                                margin:
                                    margin,

                                week:
                                    week,

                                season:
                                    league.season

                            };

                        }

                    });

                }
            );

		// PLAYOFF RECORDS

const playoffWeek =
    Number(
        league.settings
            ?.playoff_week_start ||
        15
    );


const finalWeek =
    Math.max(
        playoffStartWeek,
        Number(
            league.settings?.leg ||
            17
        )
    );


for (
    let week = playoffStartWeek;
    week <= finalWeek;
    week++
) {

    const playoffMatchups =
        await fetchJSON(
            `https://api.sleeper.app/v1/league/${league.league_id}/matchups/${week}`
        );


    const playoffGroups = {};


    playoffMatchups.forEach(team => {

        if (
            team.matchup_id == null
        ) {
            return;
        }


        if (
            !playoffGroups[
                team.matchup_id
            ]
        ) {

            playoffGroups[
                team.matchup_id
            ] = [];

        }


        playoffGroups[
            team.matchup_id
        ].push(team);

    });


    Object.values(
        playoffGroups
    ).forEach(matchup => {


        if (
            matchup.length !== 2
        ) {
            return;
        }


        const teamA =
            matchup[0];

        const teamB =
            matchup[1];


        const scoreA =
            Number(teamA.points) || 0;

        const scoreB =
            Number(teamB.points) || 0;


        if (
            scoreA <= 0 ||
            scoreB <= 0
        ) {
            return;
        }


        const margin =
            Math.abs(
                scoreA - scoreB
            );


        const infoA =
            getTeamInfo(
                teamA.roster_id
            );


        const infoB =
            getTeamInfo(
                teamB.roster_id
            );


        let winner;

        let loser;


        if (scoreA >= scoreB) {

            winner = {
                ...infoA,
                score: scoreA
            };

            loser = {
                ...infoB,
                score: scoreB
            };

        } else {

            winner = {
                ...infoB,
                score: scoreB
            };

            loser = {
                ...infoA,
                score: scoreA
            };

        }


        // PLAYOFF MASSACRE

        if (
            !playoffMassacre ||
            margin >
            playoffMassacre.margin
        ) {

            playoffMassacre = {

                winner:
                    winner,

                loser:
                    loser,

                margin:
                    margin,

                week:
                    week,

                season:
                    league.season

            };

        }


        // PLAYOFF BAR FIGHT

        if (
            !playoffBarFight ||
            margin <
            playoffBarFight.margin
        ) {

            playoffBarFight = {

                winner:
                    winner,

                loser:
                    loser,

                margin:
                    margin,

                week:
                    week,

                season:
                    league.season

            };

        }

    });

}

        }


        container.innerHTML = `

            <div class="record-card">

                <div class="record-icon">
                    &#128293;
                </div>

                <div class="record-label">
                    Highest Weekly Score
                </div>

                <div class="record-holder">
                    ${highestWeeklyScore.teamName}
                </div>

                <div class="record-manager">
                    ${highestWeeklyScore.managerName}
                </div>

                <div class="record-value">
                    ${highestWeeklyScore.score.toFixed(2)} pts
                </div>

                <div class="record-context">
                    Week ${highestWeeklyScore.week}
                    •
                    ${highestWeeklyScore.season}
                </div>

            </div>


            <div class="record-card">

                <div class="record-icon">
                    &#128465;
                </div>

                <div class="record-label">
                    Lowest Weekly Score
                </div>

                <div class="record-holder">
                    ${lowestWeeklyScore.teamName}
                </div>

                <div class="record-manager">
                    ${lowestWeeklyScore.managerName}
                </div>

                <div class="record-value">
                    ${lowestWeeklyScore.score.toFixed(2)} pts
                </div>

                <div class="record-context">
                    Week ${lowestWeeklyScore.week}
                    •
                    ${lowestWeeklyScore.season}
                </div>

            </div>


            <div class="record-card">

                <div class="record-icon">
                    &#128165;
                </div>

                <div class="record-label">
                    Biggest Beatdown
                </div>

                <div class="record-holder">
                    ${biggestBlowout.winner.teamName}
                </div>

                <div class="record-manager">
                    beat
                    ${biggestBlowout.loser.teamName}
                </div>

                <div class="record-value">
                    ${biggestBlowout.margin.toFixed(2)} pts
                </div>

                <div class="record-context">
                    Week ${biggestBlowout.week}
                    •
                    ${biggestBlowout.season}
                </div>

            </div>


            <div class="record-card">

                <div class="record-icon">
                    &#128148;
                </div>

                <div class="record-label">
                    Closest Game
                </div>

                <div class="record-holder">
                    ${closestGame.winner.teamName}
                </div>

                <div class="record-manager">
                    over
                    ${closestGame.loser.teamName}
                </div>

                <div class="record-value">
                    ${closestGame.margin.toFixed(2)} pts
                </div>

                <div class="record-context">
                    Week ${closestGame.week}
                    •
                    ${closestGame.season}
                </div>

            </div>


            <div class="record-card">

                <div class="record-icon">
                    &#127942;
                </div>

                <div class="record-label">
                    Best Regular-Season Record
                </div>

                <div class="record-holder">
                    ${bestRecord.teamName}
                </div>

                <div class="record-manager">
                    ${bestRecord.managerName}
                </div>

                <div class="record-value">
                    ${bestRecord.wins}-${bestRecord.losses}
                </div>

                <div class="record-context">
                    ${bestRecord.season}
                </div>

            </div>


            <div class="record-card">

                <div class="record-icon">
                    &#128200;
                </div>

                <div class="record-label">
                    Most Season Points
                </div>

                <div class="record-holder">
                    ${seasonPointsLeader.teamName}
                </div>

                <div class="record-manager">
                    ${seasonPointsLeader.managerName}
                </div>

                <div class="record-value">
                    ${seasonPointsLeader.points.toFixed(2)} pts
                </div>

                <div class="record-context">
                    ${seasonPointsLeader.season}
                </div>

            </div>

		<div class="record-card">

    <div class="record-icon">
        &#127866;
    </div>

    <div class="record-label">
        The Miracle Pint
    </div>

    <div class="record-subtitle">
        Fewest points in a win
    </div>

    <div class="record-holder">
        ${miraclePint.teamName}
    </div>

    <div class="record-manager">
        ${miraclePint.managerName}
    </div>

    <div class="record-value">
        ${miraclePint.score.toFixed(2)} pts
    </div>

    <div class="record-context">
        Beat ${miraclePint.loserName}
        • Week ${miraclePint.week}
        • ${miraclePint.season}
    </div>

</div>


<div class="record-card">

    <div class="record-icon">
        &#128557;
    </div>

    <div class="record-label">
        The Bad Beat
    </div>

    <div class="record-subtitle">
        Most points in a loss
    </div>

    <div class="record-holder">
        ${badBeat.teamName}
    </div>

    <div class="record-manager">
        ${badBeat.managerName}
    </div>

    <div class="record-value">
        ${badBeat.score.toFixed(2)} pts
    </div>

    <div class="record-context">
        Lost to ${badBeat.winnerName}
        • Week ${badBeat.week}
        • ${badBeat.season}
    </div>

</div>


<div class="record-card">

    <div class="record-icon">
        &#129354;
    </div>

    <div class="record-label">
        Playoff Bar Fight
    </div>

    <div class="record-subtitle">
        Closest playoff matchup
    </div>

    <div class="record-holder">
        ${playoffBarFight.winner.teamName}
    </div>

    <div class="record-manager">
        survived
        ${playoffBarFight.loser.teamName}
    </div>

    <div class="record-value">
        ${playoffBarFight.margin.toFixed(2)} pts
    </div>

    <div class="record-context">
        Week ${playoffBarFight.week}
        • ${playoffBarFight.season}
    </div>

</div>


<div class="record-card">

    <div class="record-icon">
        &#9760;
    </div>

    <div class="record-label">
        Playoff Massacre
    </div>

    <div class="record-subtitle">
        Biggest playoff blowout
    </div>

    <div class="record-holder">
        ${playoffMassacre.winner.teamName}
    </div>

    <div class="record-manager">
        destroyed
        ${playoffMassacre.loser.teamName}
    </div>

    <div class="record-value">
        ${playoffMassacre.margin.toFixed(2)} pts
    </div>

    <div class="record-context">
        Week ${playoffMassacre.week}
        • ${playoffMassacre.season}
    </div>

		</div>
       
	 <div class="record-card">

    <div class="record-icon">
        &#128293;
    </div>

    <div class="record-label">
        The Heater
    </div>

    <div class="record-subtitle">
        Longest winning streak
    </div>

    <div class="record-holder">
        ${longestWinStreak.teamName}
    </div>

    <div class="record-manager">
        ${longestWinStreak.managerName}
    </div>

    <div class="record-value">
        ${longestWinStreak.length} straight wins
    </div>

    <div class="record-context">
        Through Week ${longestWinStreak.endingWeek}
        • ${longestWinStreak.season}
    </div>

</div>


<div class="record-card">

    <div class="record-icon">
        &#127866;
    </div>

    <div class="record-label">
        Cut Off at the Bar
    </div>

    <div class="record-subtitle">
        Longest losing streak
    </div>

    <div class="record-holder">
        ${longestLoseStreak.teamName}
    </div>

    <div class="record-manager">
        ${longestLoseStreak.managerName}
    </div>

    <div class="record-value">
        ${longestLoseStreak.length} straight losses
    </div>

    <div class="record-context">
        Through Week ${longestLoseStreak.endingWeek}
        • ${longestLoseStreak.season}
    </div>

</div>

	`;


    }

    catch (error) {

        console.error(
            "Error loading Record Book:",
            error
        );


        container.innerHTML = `

            <div class="history-notice">

                Unable to load the Record Book.

            </div>

        `;

    }

}


loadRecordBook();