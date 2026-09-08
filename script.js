const leagueID = "1380159618264621056";

let nflPlayers = {};

fetch(`https://api.sleeper.app/v1/league/${leagueID}`)
    .then(response => response.json())
    .then(league => {

	console.log(league);

	document.getElementById("league-name").textContent =
    	league.name;

	document.getElementById("league-season").textContent =
    	league.season + " Fantasy Football Season";

        
        
    })
    .catch(error => {
        console.error("Error loading Sleeper league:", error);
    });

fetch(`https://api.sleeper.app/v1/league/${leagueID}/users`)
    .then(response => response.json())
    .then(users => {

        console.log(users);

        const teamsContainer =
            document.getElementById("teams-container");

        teamsContainer.innerHTML = "";

        users.forEach(user => {

            const teamCard = document.createElement("div");

            teamCard.classList.add("team-card");
	
	    teamCard.dataset.userId =
    		user.user_id;

            const teamName =
    user.metadata?.team_name || "Unnamed Team";


let avatarHTML;


if (user.avatar) {

    avatarHTML = `
        <img
            class="team-avatar"
            src="https://sleepercdn.com/avatars/thumbs/${user.avatar}"
            alt="${user.display_name}"
        >
    `;

} else {

    avatarHTML = `
        <div class="team-avatar avatar-fallback">
            ${user.display_name.charAt(0).toUpperCase()}
        </div>
    `;

}


teamCard.innerHTML = `

    <div class="team-card-top">

        ${avatarHTML}

        <div>

            <h3>${teamName}</h3>

            <p>
                Manager: ${user.display_name}
            </p>

        </div>

    </div>

`;

teamCard.addEventListener("click", () => {

    window.location.href =
        `team.html?user=${user.user_id}`;

});
            
teamsContainer.appendChild(teamCard);

        });

    })
    .catch(error => {
        console.error("Error loading league users:", error);
    });

Promise.all([

    fetch(`https://api.sleeper.app/v1/league/${leagueID}/users`)
        .then(response => response.json()),

    fetch(`https://api.sleeper.app/v1/league/${leagueID}/rosters`)
        .then(response => response.json())

])
.then(([users, rosters]) => {

    const standingsBody =
        document.getElementById("standings-body");


    const userMap = {};


    users.forEach(user => {

        userMap[user.user_id] = user;

    });


    const standings = rosters.map(roster => {

        const user = userMap[roster.owner_id];


        const teamName =
            user?.metadata?.team_name ||
            user?.display_name ||
            `Team ${roster.roster_id}`;


        const managerName =
            user?.display_name || "Unknown";


        const wins =
    roster.settings?.wins || 0;

const losses =
    roster.settings?.losses || 0;

const ties =
    roster.settings?.ties || 0;

const points =
    (roster.settings?.fpts || 0) +
    ((roster.settings?.fpts_decimal || 0) / 100);


        return {

    teamName: teamName,
    managerName: managerName,
    wins: wins,
    losses: losses,
    ties: ties,
    points: points

};

    });


    standings.sort((a, b) => {

        if (b.wins !== a.wins) {

            return b.wins - a.wins;

        }

        return b.points - a.points;

    });


    standingsBody.innerHTML = "";


    standings.forEach((team, index) => {

        const row =
            document.createElement("tr");


        row.innerHTML = `

    <td>${index + 1}</td>

    <td>${team.teamName}</td>

    <td>${team.managerName}</td>

    <td>
        ${team.wins}-${team.losses}${team.ties > 0 ? `-${team.ties}` : ""}
    </td>

    <td>${team.points.toFixed(2)}</td>

	`;


        standingsBody.appendChild(row);

    });

})
.catch(error => {

    console.error(
        "Error loading standings:",
        error
    );

});

fetch(`https://api.sleeper.app/v1/league/${leagueID}`)

    .then(response => response.json())

    .then(league => {

        const currentWeek = league.settings.leg;

        document.getElementById("matchups-title").textContent =
            `Week ${currentWeek} Matchups`;


        return Promise.all([

            fetch(`https://api.sleeper.app/v1/league/${leagueID}/users`)
                .then(response => response.json()),

            fetch(`https://api.sleeper.app/v1/league/${leagueID}/rosters`)
                .then(response => response.json()),

            fetch(
                `https://api.sleeper.app/v1/league/${leagueID}/matchups/${currentWeek}`
            )
                .then(response => response.json())

        ]);

    })

    .then(([users, rosters, matchups]) => {


        const usersByID = {};

        users.forEach(user => {

            usersByID[user.user_id] = user;

        });


        const rostersByID = {};

        rosters.forEach(roster => {

            rostersByID[roster.roster_id] = roster;

        });


        const matchupGroups = {};


        matchups.forEach(team => {

            if (!matchupGroups[team.matchup_id]) {

                matchupGroups[team.matchup_id] = [];

            }

            matchupGroups[team.matchup_id].push(team);

        });


        const matchupsContainer =
            document.getElementById("matchups-container");


        matchupsContainer.innerHTML = "";


        Object.keys(matchupGroups)
            .sort((a, b) => a - b)
            .forEach(matchupID => {


                const teams = matchupGroups[matchupID];


                const matchupCard =
                    document.createElement("div");


                matchupCard.classList.add("matchup-card");
		
		const firstRoster =
   		rostersByID[teams[0].roster_id];

		const firstUser =
    		usersByID[firstRoster.owner_id];


                let teamsHTML = "";


                teams.forEach(matchupTeam => {


                    const roster =
                        rostersByID[matchupTeam.roster_id];


                    const user =
                        usersByID[roster.owner_id];


                    const teamName =
                        user?.metadata?.team_name ||
                        user?.display_name ||
                        `Team ${roster.roster_id}`;


                    const managerName =
                        user?.display_name || "Unknown";


                    let avatarHTML;


                    if (user?.avatar) {

                        avatarHTML = `
                            <img
                                class="team-avatar"
                                src="https://sleepercdn.com/avatars/thumbs/${user.avatar}"
                                alt="${managerName}"
                            >
                        `;

                    } else {

                        avatarHTML = `
                            <div class="team-avatar avatar-fallback">
                                ${managerName.charAt(0).toUpperCase()}
                            </div>
                        `;

                    }


                    const score =
                        matchupTeam.points || 0;


                    teamsHTML += `

                        <div class="matchup-team">

                            <div class="matchup-team-info">

                                ${avatarHTML}

                                <div>

                                    <p class="matchup-team-name">
                                        ${teamName}
                                    </p>

                                    <p class="matchup-manager">
                                        ${managerName}
                                    </p>

                                </div>

                            </div>

                            <div class="matchup-score">
                                ${score.toFixed(2)}
                            </div>

                        </div>

                    `;

                });


                matchupCard.innerHTML = `

                    <div class="matchup-header">
                        Matchup ${matchupID}
                    </div>

                    ${teamsHTML}

                `;

		if (firstUser?.user_id) {

    matchupCard.classList.add(
        "clickable-matchup"
    );

    matchupCard.addEventListener(
        "click",
        () => {

            window.location.href =
                `team.html?user=${firstUser.user_id}#team-matchup`;

        }
    );

}
                matchupsContainer.appendChild(matchupCard);

            });

    })

    .catch(error => {

        console.error(
            "Error loading weekly matchups:",
            error
        );

    });

 fetch("https://api.sleeper.app/v1/players/nfl")

    .then(response => response.json())

    .then(players => {

        nflPlayers = players;

        console.log(
            "NFL player database loaded"
        );

    })

    .catch(error => {

        console.error(
            "Error loading NFL players:",
            error
        );

    });

function openTeamRoster(user) {

    const modal =
        document.getElementById("roster-modal");

    const rosterTeamName =
        document.getElementById("roster-team-name");

    const rosterManager =
        document.getElementById("roster-manager");

    const rosterPlayers =
        document.getElementById("roster-players");


    const teamName =
        user.metadata?.team_name ||
        user.display_name;


    rosterTeamName.textContent =
        teamName;

    rosterManager.textContent =
        `Manager: ${user.display_name}`;


    rosterPlayers.innerHTML =
        "Loading roster...";


    modal.style.display =
        "flex";


    fetch(
        `https://api.sleeper.app/v1/league/${leagueID}/rosters`
    )

        .then(response => response.json())

        .then(rosters => {


            const roster =
                rosters.find(
                    roster =>
                        roster.owner_id === user.user_id
                );


            if (!roster) {

                rosterPlayers.innerHTML =
                    "<p>Roster not found.</p>";

                return;

            }


            rosterPlayers.innerHTML = "";


const positionOrder = {
    QB: 1,
    RB: 2,
    WR: 3,
    TE: 4,
    K: 5,
    DEF: 6
};


const players = roster.players
    .map(playerID => nflPlayers[playerID])
    .filter(player => player);


players.sort((a, b) => {

    const positionA =
        positionOrder[a.position] || 99;

    const positionB =
        positionOrder[b.position] || 99;

    return positionA - positionB;

});


players.forEach(player => {

    const playerRow =
        document.createElement("div");

    playerRow.classList.add("player-row");


    let playerName;


    if (player.position === "DEF") {

        playerName =
            `${player.team} Defense`;

    } else {

        playerName =
            player.full_name ||
            `${player.first_name || ""} ${player.last_name || ""}`.trim() ||
            "Unknown Player";

    }


    const positionRank = "--";


    playerRow.innerHTML = `

    <span class="player-name">
        ${playerName}
    </span>

    <div class="player-details">

        <span class="player-position">
            ${player.position}
        </span>

        <span class="player-rank">
            ${player.position}${positionRank}
        </span>

    </div>

`;


    rosterPlayers.appendChild(playerRow);

});

        })

        .catch(error => {

            console.error(
                "Error loading roster:",
                error
            );

        });

}

document
    .getElementById("close-roster")
    .addEventListener("click", () => {

        document.getElementById(
            "roster-modal"
        ).style.display = "none";

    });

document
    .getElementById("roster-modal")
    .addEventListener("click", event => {

        if (
            event.target.id ===
            "roster-modal"
        ) {

            event.target.style.display =
                "none";

        }

    });

function loadWeeklyAwards() {

    fetch(
        `https://api.sleeper.app/v1/league/${leagueID}`
    )

        .then(response => response.json())

        .then(league => {

            const currentWeek =
                league.settings.leg;


            document.getElementById(
                "awards-title"
            ).textContent =
                `Week ${currentWeek} Tavern Awards`;


            return Promise.all([

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}/users`
                ).then(
                    response => response.json()
                ),

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}/rosters`
                ).then(
                    response => response.json()
                ),

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}/matchups/${currentWeek}`
                ).then(
                    response => response.json()
                )

            ]);

        })

        .then(([users, rosters, matchups]) => {


            const awardsContainer =
                document.getElementById(
                    "awards-container"
                );


            const usersByID = {};

            users.forEach(user => {

                usersByID[user.user_id] =
                    user;

            });


            const rostersByID = {};

            rosters.forEach(roster => {

                rostersByID[roster.roster_id] =
                    roster;

            });


            const teams =
                matchups.map(team => {


                    const roster =
                        rostersByID[
                            team.roster_id
                        ];


                    const user =
                        usersByID[
                            roster.owner_id
                        ];


                    return {

                        matchupID:
                            team.matchup_id,

                        rosterID:
                            team.roster_id,

                        score:
                            team.points || 0,

                        teamName:
                            user?.metadata?.team_name ||
                            user?.display_name ||
                            `Team ${team.roster_id}`,

                        managerName:
                            user?.display_name ||
                            "Unknown"

                    };

                });


            const scoringHasStarted =
                teams.some(
                    team => team.score > 0
                );


            if (!scoringHasStarted) {

                awardsContainer.innerHTML = `

                    <div class="awards-waiting">

                        🍻 Week awards will appear once scoring begins.

                    </div>

                `;

                return;

            }


            const sortedByScore =
                [...teams].sort(
                    (a, b) =>
                        b.score - a.score
                );


            const monster =
                sortedByScore[0];


            const biggestLoser =
                sortedByScore[
                    sortedByScore.length - 1
                ];


            const matchupGroups = {};


            teams.forEach(team => {

                if (
                    !matchupGroups[
                        team.matchupID
                    ]
                ) {

                    matchupGroups[
                        team.matchupID
                    ] = [];

                }


                matchupGroups[
                    team.matchupID
                ].push(team);

            });


            const finishedMatchups = [];


            Object.values(
                matchupGroups
            ).forEach(matchup => {

                if (matchup.length !== 2) {
                    return;
                }


                const teamA =
                    matchup[0];

                const teamB =
                    matchup[1];


                const margin =
                    Math.abs(
                        teamA.score -
                        teamB.score
                    );


                const winner =
                    teamA.score >=
                    teamB.score
                        ? teamA
                        : teamB;


                const loser =
                    teamA.score >=
                    teamB.score
                        ? teamB
                        : teamA;


                finishedMatchups.push({

                    winner:
                        winner,

                    loser:
                        loser,

                    margin:
                        margin

                });

            });


            const biggestBeatdown =
                [...finishedMatchups]
                    .sort(
                        (a, b) =>
                            b.margin -
                            a.margin
                    )[0];


            const closestGame =
                [...finishedMatchups]
                    .sort(
                        (a, b) =>
                            a.margin -
                            b.margin
                    )[0];


            awardsContainer.innerHTML = `

                <div class="award-card">

                    <div class="award-icon">
                        👹
                    </div>

                    <div class="award-name">
                        Monster of the Week
                    </div>

                    <div class="award-team">
                        ${monster.teamName}
                    </div>

                    <div class="award-manager">
                        ${monster.managerName}
                    </div>

                    <div class="award-result">
                        ${monster.score.toFixed(2)}
                        points
                    </div>

                </div>


                <div class="award-card">

                    <div class="award-icon">
                        🗑️
                    </div>

                    <div class="award-name">
                        Biggest Loser
                    </div>

                    <div class="award-team">
                        ${biggestLoser.teamName}
                    </div>

                    <div class="award-manager">
                        ${biggestLoser.managerName}
                    </div>

                    <div class="award-result">
                        ${biggestLoser.score.toFixed(2)}
                        points
                    </div>

                </div>


                <div class="award-card">

                    <div class="award-icon">
                        💥
                    </div>

                    <div class="award-name">
                        Beatdown of the Week
                    </div>

                    <div class="award-team">
                        ${biggestBeatdown.winner.teamName}
                    </div>

                    <div class="award-manager">
                        beat
                        ${biggestBeatdown.loser.teamName}
                    </div>

                    <div class="award-result">
                        Won by
                        ${biggestBeatdown.margin.toFixed(2)}
                        points
                    </div>

                </div>


                <div class="award-card">

                    <div class="award-icon">
                        💔
                    </div>

                    <div class="award-name">
                        Heartbreaker
                    </div>

                    <div class="award-team">
                        ${closestGame.loser.teamName}
                    </div>

                    <div class="award-manager">
                        ${closestGame.loser.managerName}
                    </div>

                    <div class="award-result">
                        Lost by only
                        ${closestGame.margin.toFixed(2)}
                        points
                    </div>

                </div>

            `;

        })

        .catch(error => {

            console.error(
                "Error loading weekly awards:",
                error
            );

        });

}


loadWeeklyAwards();

function loadLeaguePulse() {

    Promise.all([

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}`
        ).then(response => response.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/users`
        ).then(response => response.json()),

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/rosters`
        ).then(response => response.json())

    ])

    .then(([league, users, rosters]) => {


        const currentWeek =
            league.settings.leg;


        document.getElementById(
            "pulse-week"
        ).textContent =
            `Week ${currentWeek}`;


        const usersByID = {};

        users.forEach(user => {

            usersByID[user.user_id] =
                user;

        });


        const teams =
            rosters.map(roster => {


                const user =
                    usersByID[
                        roster.owner_id
                    ];


                const teamName =
                    user?.metadata?.team_name ||
                    user?.display_name ||
                    `Team ${roster.roster_id}`;


                const wins =
    roster.settings?.wins || 0;

const losses =
    roster.settings?.losses || 0;

const ties =
    roster.settings?.ties || 0;

const points =
    (roster.settings?.fpts || 0) +
    ((roster.settings?.fpts_decimal || 0) / 100);


                return {

    teamName: teamName,
    wins: wins,
    losses: losses,
    ties: ties,
    points: points

};

            });


        const standingsLeader =
            [...teams].sort(
                (a, b) => {

                    if (
                        b.wins !== a.wins
                    ) {

                        return (
                            b.wins -
                            a.wins
                        );

                    }

                    return (
                        b.points -
                        a.points
                    );

                }
            )[0];


        document.getElementById(
            "pulse-leader"
        ).textContent =
            standingsLeader.teamName;


        document.getElementById(
            "pulse-leader-detail"
        ).textContent =
            `${standingsLeader.wins}-${standingsLeader.losses}`;


        const pointsLeader =
            [...teams].sort(
                (a, b) =>
                    b.points -
                    a.points
            )[0];


        document.getElementById(
            "pulse-points"
        ).textContent =
            pointsLeader.teamName;


        document.getElementById(
            "pulse-points-detail"
        ).textContent =
            `${pointsLeader.points.toFixed(2)} pts`;


        if (currentWeek <= 1) {

            document.getElementById(
                "pulse-monster"
            ).textContent =
                "Coming Soon";


            document.getElementById(
                "pulse-monster-detail"
            ).textContent =
                "After Week 1";


            return;

        }


        const previousWeek =
            currentWeek - 1;


        return fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/${previousWeek}`
        )

        .then(response => response.json())

        .then(matchups => {


            const rostersByID = {};

            rosters.forEach(roster => {

                rostersByID[
                    roster.roster_id
                ] = roster;

            });


            let monster = null;


            matchups.forEach(team => {

                if (
                    !monster ||
                    team.points >
                    monster.points
                ) {

                    monster = team;

                }

            });


            if (!monster) {
                return;
            }


            const monsterRoster =
                rostersByID[
                    monster.roster_id
                ];


            const monsterUser =
                usersByID[
                    monsterRoster.owner_id
                ];


            const monsterName =
                monsterUser?.metadata?.team_name ||
                monsterUser?.display_name ||
                "Unknown Team";


            document.getElementById(
                "pulse-monster"
            ).textContent =
                monsterName;


            document.getElementById(
                "pulse-monster-detail"
            ).textContent =
                `${monster.points.toFixed(2)} pts`;

        });

    })

    .catch(error => {

        console.error(
            "Error loading League Pulse:",
            error
        );

    });

}


loadLeaguePulse();

function loadGameOfTheWeek() {

    Promise.all([

        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}`
        ).then(response => response.json()),


        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/users`
        ).then(response => response.json()),


        fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/rosters`
        ).then(response => response.json())

    ])

    .then(([league, users, rosters]) => {


        const currentWeek =
            league.settings.leg;


        return fetch(
            `https://api.sleeper.app/v1/league/${leagueID}/matchups/${currentWeek}`
        )

        .then(response => response.json())

        .then(matchups => {

            return {
                league,
                users,
                rosters,
                matchups,
                currentWeek
            };

        });

    })


    .then(data => {

        const {
            users,
            rosters,
            matchups,
            currentWeek
        } = data;


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


        const matchupOptions = [];


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


            const rosterA =
                rostersByID[
                    teamA.roster_id
                ];


            const rosterB =
                rostersByID[
                    teamB.roster_id
                ];


            const pointsA =
                (
                    rosterA.settings?.fpts ||
                    0
                )
                +
                (
                    (
                        rosterA.settings
                            ?.fpts_decimal ||
                        0
                    ) / 100
                );


            const pointsB =
                (
                    rosterB.settings?.fpts ||
                    0
                )
                +
                (
                    (
                        rosterB.settings
                            ?.fpts_decimal ||
                        0
                    ) / 100
                );


            matchupOptions.push({

                teamA,
                teamB,
                rosterA,
                rosterB,

                combinedPoints:
                    pointsA + pointsB

            });

        });


        matchupOptions.sort(
            (a, b) =>
                b.combinedPoints -
                a.combinedPoints
        );


        const featured =
            matchupOptions[0];


        if (!featured) {

            document.getElementById(
                "game-of-week-container"
            ).innerHTML =
                "No featured matchup available.";

            return;

        }


        const userA =
            usersByID[
                featured.rosterA.owner_id
            ];


        const userB =
            usersByID[
                featured.rosterB.owner_id
            ];


        const teamNameA =
            userA?.metadata?.team_name ||
            userA?.display_name ||
            "Team A";


        const teamNameB =
            userB?.metadata?.team_name ||
            userB?.display_name ||
            "Team B";


        const managerA =
            userA?.display_name ||
            "Unknown";


        const managerB =
            userB?.display_name ||
            "Unknown";


        const avatarA =
            userA?.avatar
                ?
                `
                    <img
                        class="game-of-week-avatar"
                        src="https://sleepercdn.com/avatars/thumbs/${userA.avatar}"
                        alt="${managerA}"
                    >
                `
                :
                "";


        const avatarB =
            userB?.avatar
                ?
                `
                    <img
                        class="game-of-week-avatar"
                        src="https://sleepercdn.com/avatars/thumbs/${userB.avatar}"
                        alt="${managerB}"
                    >
                `
                :
                "";


        const scoreA =
            featured.teamA.points || 0;


        const scoreB =
            featured.teamB.points || 0;


        document.getElementById(
            "game-of-week-title"
        ).textContent =
            `Week ${currentWeek} Game of the Week`;


        const container =
            document.getElementById(
                "game-of-week-container"
            );


        container.innerHTML = `

            <div class="game-of-week-card">

                <div class="game-of-week-teams">

                    <div class="game-of-week-team">

                        ${avatarA}

                        <h3>
                            ${teamNameA}
                        </h3>

                        <div class="game-of-week-manager">
                            ${managerA}
                        </div>

                        <div class="game-of-week-score">
                            ${scoreA.toFixed(2)}
                        </div>

                    </div>


                    <div class="game-of-week-vs">
                        VS
                    </div>


                    <div class="game-of-week-team">

                        ${avatarB}

                        <h3>
                            ${teamNameB}
                        </h3>

                        <div class="game-of-week-manager">
                            ${managerB}
                        </div>

                        <div class="game-of-week-score">
                            ${scoreB.toFixed(2)}
                        </div>

                    </div>

                </div>


                <div class="game-of-week-footer">

                    Highest combined season scoring matchup
                    •
                    Click to view full matchup

                </div>

            </div>

        `;


        container
            .querySelector(
                ".game-of-week-card"
            )
            .addEventListener(
                "click",
                () => {

                    window.location.href =
                        `team.html?user=${userA.user_id}#team-matchup`;

                }
            );

    })


    .catch(error => {

        console.error(
            "Error loading Game of the Week:",
            error
        );

    });

}


loadGameOfTheWeek();



