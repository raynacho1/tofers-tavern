const leagueID = "1380159618264621056";


async function loadWeeklyRecap() {

    try {

        const [league, users, rosters] =
            await Promise.all([

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}`
                ).then(response => response.json()),

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}/users`
                ).then(response => response.json()),

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}/rosters`
                ).then(response => response.json())

            ]);


        const currentWeek =
            Number(league.settings?.leg || 1);


        const recapWeek =
            currentWeek > 1
                ? currentWeek - 1
                : 1;


        const matchups =
            await fetch(
                `https://api.sleeper.app/v1/league/${leagueID}/matchups/${recapWeek}`
            ).then(response => response.json());


        document.getElementById(
            "recap-title"
        ).textContent =
            `Week ${recapWeek} Tavern Recap`;


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
            matchups.map(matchup => {

                const roster =
                    rostersByID[
                        matchup.roster_id
                    ];

                const user =
                    usersByID[
                        roster?.owner_id
                    ];

                return {

                    matchupID:
                        matchup.matchup_id,

                    rosterID:
                        matchup.roster_id,

                    userID:
                        user?.user_id,

                    teamName:
                        user?.metadata?.team_name ||
                        user?.display_name ||
                        `Team ${matchup.roster_id}`,

                    manager:
                        user?.display_name ||
                        "Unknown",

                    score:
                        Number(matchup.points) || 0

                };

            });


        const hasScoring =
            teams.some(team => team.score > 0);


        if (!hasScoring) {

            showWaitingMessage(
                recapWeek
            );

            return;

        }


        const matchupGroups = {};


        teams.forEach(team => {

            if (
                team.matchupID == null
            ) {
                return;
            }


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


        const results = [];


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


            let winner;
            let loser;


            if (
                teamA.score >
                teamB.score
            ) {

                winner = teamA;
                loser = teamB;

            }

            else if (
                teamB.score >
                teamA.score
            ) {

                winner = teamB;
                loser = teamA;

            }

            else {

                winner = teamA;
                loser = teamB;

            }


            results.push({

                teamA,
                teamB,
                winner,
                loser,

                margin:
                    Math.abs(
                        teamA.score -
                        teamB.score
                    )

            });

        });


        const scores =
            [...teams].sort(
                (a, b) =>
                    b.score -
                    a.score
            );


        const monster =
            scores[0];


        const lowestScore =
            scores[
                scores.length - 1
            ];


        const biggestBeatdown =
            [...results].sort(
                (a, b) =>
                    b.margin -
                    a.margin
            )[0];


        const closestGame =
            [...results].sort(
                (a, b) =>
                    a.margin -
                    b.margin
            )[0];


        displayStory(
            recapWeek,
            monster,
            biggestBeatdown,
            closestGame
        );


        displayAwards(
            monster,
            lowestScore,
            biggestBeatdown,
            closestGame
        );


        displayGames(
            results
        );

    }

    catch (error) {

        console.error(
            "Weekly recap error:",
            error
        );


        document.getElementById(
            "recap-story"
        ).innerHTML = `

            <div class="recap-message">
                Couldn't load the weekly recap.
            </div>

        `;

    }

}



function showWaitingMessage(week) {

    document.getElementById(
        "recap-story"
    ).innerHTML = `

        <div class="recap-message">

            <div class="recap-message-icon">
                &#127867;
            </div>

            <h3>
                The Tavern is still quiet.
            </h3>

            <p>
                Week ${week} hasn't produced a recap yet.
                Come back after the games are played.
            </p>

        </div>

    `;


    document.getElementById(
        "recap-awards"
    ).innerHTML = "";


    document.getElementById(
        "recap-games"
    ).innerHTML = "";

}



function displayStory(
    week,
    monster,
    beatdown,
    closest
) {

    document.getElementById(
        "recap-story"
    ).innerHTML = `

        <div class="recap-story-card">

            <p>

                <strong>
                    ${monster.teamName}
                </strong>

                set the pace in Week ${week},
                dropping

                <strong>
                    ${monster.score.toFixed(2)}
                    points
                </strong>

                to earn Monster of the Week.

                ${beatdown
                    ?
                    `
                    Meanwhile,

                    <strong>
                        ${beatdown.winner.teamName}
                    </strong>

                    delivered the week's biggest beatdown,
                    defeating

                    <strong>
                        ${beatdown.loser.teamName}
                    </strong>

                    by

                    <strong>
                        ${beatdown.margin.toFixed(2)}
                        points.
                    </strong>
                    `
                    :
                    ""
                }

                ${closest
                    ?
                    `
                    The closest bar fight came between

                    <strong>
                        ${closest.teamA.teamName}
                    </strong>

                    and

                    <strong>
                        ${closest.teamB.teamName}
                    </strong>,

                    decided by only

                    <strong>
                        ${closest.margin.toFixed(2)}
                        points.
                    </strong>
                    `
                    :
                    ""
                }

            </p>

        </div>

    `;

}



function displayAwards(
    monster,
    lowest,
    beatdown,
    closest
) {

    const container =
        document.getElementById(
            "recap-awards"
        );


    container.innerHTML = `

        <div class="recap-award-card">

            <span class="recap-award-label">
                &#128165; Monster of the Week
            </span>

            <strong>
                ${monster.teamName}
            </strong>

            <span>
                ${monster.score.toFixed(2)} pts
            </span>

        </div>


        <div class="recap-award-card">

            <span class="recap-award-label">
                &#128465; Biggest Loser
            </span>

            <strong>
                ${lowest.teamName}
            </strong>

            <span>
                ${lowest.score.toFixed(2)} pts
            </span>

        </div>


        <div class="recap-award-card">

            <span class="recap-award-label">
                &#128074; Beatdown
            </span>

            <strong>
                ${beatdown.winner.teamName}
            </strong>

            <span>
                Won by
                ${beatdown.margin.toFixed(2)}
            </span>

        </div>


        <div class="recap-award-card">

            <span class="recap-award-label">
                &#128148; Heartbreaker
            </span>

            <strong>
                ${closest.loser.teamName}
            </strong>

            <span>
                Lost by
                ${closest.margin.toFixed(2)}
            </span>

        </div>

    `;

}



function displayGames(results) {

    const container =
        document.getElementById(
            "recap-games"
        );


    container.innerHTML = "";


    results.forEach(result => {

        const card =
            document.createElement(
                "div"
            );


        card.classList.add(
            "recap-game-card"
        );


        card.innerHTML = `

            <div class="recap-game-team">

                <strong>
                    ${result.teamA.teamName}
                </strong>

                <span>
                    ${result.teamA.score.toFixed(2)}
                </span>

            </div>


            <div class="recap-game-vs">
                VS
            </div>


            <div class="recap-game-team">

                <strong>
                    ${result.teamB.teamName}
                </strong>

                <span>
                    ${result.teamB.score.toFixed(2)}
                </span>

            </div>

        `;


        if (
            result.teamA.userID
        ) {

            card.addEventListener(
                "click",
                () => {

                    window.location.href =
                        `team.html?user=${result.teamA.userID}#team-matchup`;

                }
            );

        }


        container.appendChild(
            card
        );

    });

}



loadWeeklyRecap();