const leagueID =
    "1380159618264621056";



function getMedian(values) {

    const sorted =
        [...values].sort(
            (a, b) => a - b
        );


    const middle =
        Math.floor(
            sorted.length / 2
        );


    if (
        sorted.length % 2 === 0
    ) {

        return (
            sorted[middle - 1] +
            sorted[middle]
        ) / 2;

    }


    return sorted[middle];

}



function getAverage(values) {

    if (!values.length) {
        return 0;
    }


    return (
        values.reduce(
            (total, value) =>
                total + value,
            0
        ) / values.length
    );

}



function getStandardDeviation(values) {

    if (
        values.length < 2
    ) {
        return 0;
    }


    const average =
        getAverage(values);


    const variance =
        getAverage(
            values.map(
                value =>
                    Math.pow(
                        value - average,
                        2
                    )
            )
        );


    return Math.sqrt(
        variance
    );

}



function normalizeScore(
    value,
    minimum,
    maximum
) {

    if (
        maximum === minimum
    ) {
        return 50;
    }


    return (
        (
            value - minimum
        )
        /
        (
            maximum - minimum
        )
    ) * 100;

}



async function loadPowerRankings() {

    try {

        const [
            league,
            users,
            rosters
        ] =
            await Promise.all([

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}`
                ).then(
                    response =>
                        response.json()
                ),

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}/users`
                ).then(
                    response =>
                        response.json()
                ),

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}/rosters`
                ).then(
                    response =>
                        response.json()
                )

            ]);


        const container =
            document.getElementById(
                "power-rankings-container"
            );


        const usersByID = {};


        users.forEach(user => {

            usersByID[
                user.user_id
            ] = user;

        });


        const currentWeek =
            Number(
                league.settings?.leg ||
                1
            );


        const rosterHasResults =
            rosters.some(
                roster =>

                    (
                        roster.settings?.wins ||
                        0
                    ) > 0

                    ||

                    (
                        roster.settings?.losses ||
                        0
                    ) > 0

                    ||

                    (
                        roster.settings?.ties ||
                        0
                    ) > 0
            );


        /*
            Normally the current Sleeper week
            is still being played.

            Power Rankings only use completed
            weeks so Sunday's live scoring
            doesn't constantly change them.
        */

        let completedWeek = 0;


        if (
            currentWeek > 1
        ) {

            completedWeek =
                currentWeek - 1;

        }

        else if (
            rosterHasResults
        ) {

            completedWeek = 1;

        }



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
                    roster.settings?.wins ||
                    0;


                const losses =
                    roster.settings?.losses ||
                    0;


                const ties =
                    roster.settings?.ties ||
                    0;


                const points =

                    (
                        roster.settings?.fpts ||
                        0
                    )

                    +

                    (
                        (
                            roster.settings
                                ?.fpts_decimal ||
                            0
                        )
                        / 100
                    );


                return {

                    rosterID:
                        roster.roster_id,

                    userID:
                        user?.user_id,

                    teamName:
                        teamName,

                    managerName:
                        user?.display_name ||
                        "Unknown",

                    avatar:
                        user?.avatar,

                    wins:
                        wins,

                    losses:
                        losses,

                    ties:
                        ties,

                    points:
                        points,

                    weeklyScores: [],

                    weeklyMargins: [],

                    weeklyPerformance: [],

                    completedPoints: 0,

                    recentScore: 50,

                    averageMargin: 0,

                    consistencyRaw: 0,

                    recordScore: 50,

                    powerScore: 0

                };

            });



        /*
            PRESEASON
        */

        if (
            completedWeek === 0
        ) {

            teams.sort(
                (a, b) =>
                    a.teamName.localeCompare(
                        b.teamName
                    )
            );


            container.innerHTML = `

                <div class="rankings-notice">

                    🍻 Tavern Power Rankings
                    are still in preseason mode.

                    <br>

                    The Tavern Power Score
                    will activate after
                    Week 1 is completed.

                </div>

            `;


            displayRankings(
                teams,
                container,
                false
            );


            return;

        }



        /*
            GET EVERY COMPLETED WEEK
        */

        const weekRequests = [];


        for (
            let week = 1;
            week <= completedWeek;
            week++
        ) {

            weekRequests.push(

                fetch(
                    `https://api.sleeper.app/v1/league/${leagueID}/matchups/${week}`
                ).then(
                    response =>
                        response.json()
                )

            );

        }


        const weeklyMatchups =
            await Promise.all(
                weekRequests
            );


        const teamsByRosterID = {};


        teams.forEach(team => {

            teamsByRosterID[
                team.rosterID
            ] = team;

        });



        weeklyMatchups.forEach(
            (matchups, weekIndex) => {


                const week =
                    weekIndex + 1;


                const validMatchups =
                    matchups.filter(
                        matchup =>
                            matchup.matchup_id != null
                    );


                const weekScores =
                    validMatchups.map(
                        matchup =>
                            Number(
                                matchup.points
                            ) || 0
                    );


                if (
                    weekScores.length === 0
                ) {
                    return;
                }


                const weeklyMedian =
                    getMedian(
                        weekScores
                    );


                const matchupGroups = {};


                validMatchups.forEach(
                    matchup => {


                        if (
                            !matchupGroups[
                                matchup.matchup_id
                            ]
                        ) {

                            matchupGroups[
                                matchup.matchup_id
                            ] = [];

                        }


                        matchupGroups[
                            matchup.matchup_id
                        ].push(
                            matchup
                        );

                    }
                );



                Object.values(
                    matchupGroups
                ).forEach(matchup => {


                    if (
                        matchup.length !== 2
                    ) {
                        return;
                    }


                    matchup.forEach(
                        teamMatchup => {


                            const opponent =
                                matchup.find(
                                    team =>
                                        team.roster_id !==
                                        teamMatchup.roster_id
                                );


                            const team =
                                teamsByRosterID[
                                    teamMatchup.roster_id
                                ];


                            if (
                                !team ||
                                !opponent
                            ) {
                                return;
                            }


                            const score =
                                Number(
                                    teamMatchup.points
                                ) || 0;


                            const opponentScore =
                                Number(
                                    opponent.points
                                ) || 0;


                            const margin =
                                score -
                                opponentScore;


                            /*
                                H2H result
                            */

                            let h2hResult = 0;


                            if (
                                score >
                                opponentScore
                            ) {

                                h2hResult = 1;

                            }

                            else if (
                                score ===
                                opponentScore
                            ) {

                                h2hResult = 0.5;

                            }


                            /*
                                MEDIAN result
                            */

                            let medianResult = 0;


                            if (
                                score >
                                weeklyMedian
                            ) {

                                medianResult = 1;

                            }

                            else if (
                                score ===
                                weeklyMedian
                            ) {

                                medianResult = 0.5;

                            }


                            const weeklyResult =
                                h2hResult +
                                medianResult;


                            let resultLabel =
                                "0-2";


                            if (
                                weeklyResult === 2
                            ) {

                                resultLabel =
                                    "2-0";

                            }

                            else if (
                                weeklyResult === 1
                            ) {

                                resultLabel =
                                    "1-1";

                            }

                            else if (
                                weeklyResult === 1.5
                            ) {

                                resultLabel =
                                    "1-0-1";

                            }

                            else if (
                                weeklyResult === 0.5
                            ) {

                                resultLabel =
                                    "0-1-1";

                            }


                            team.weeklyScores.push(
                                score
                            );


                            team.weeklyMargins.push(
                                margin
                            );


                            team.weeklyPerformance.push({

                                week:
                                    week,

                                score:
                                    (
                                        weeklyResult /
                                        2
                                    ) * 100,

                                label:
                                    resultLabel

                            });

                        }
                    );

                });

            }
        );



        /*
            CALCULATE RAW VALUES
        */

        teams.forEach(team => {


            team.completedPoints =
                team.weeklyScores.reduce(
                    (total, score) =>
                        total + score,
                    0
                );


            const totalGames =

                team.wins +

                team.losses +

                team.ties;


            if (
                totalGames > 0
            ) {

                team.recordScore =

                    (
                        team.wins +

                        (
                            team.ties *
                            0.5
                        )
                    )

                    /

                    totalGames

                    *

                    100;

            }


            team.averageMargin =
                getAverage(
                    team.weeklyMargins
                );


            team.consistencyRaw =
                getStandardDeviation(
                    team.weeklyScores
                );


            const recentWeeks =
                team.weeklyPerformance
                    .slice(-3);


            if (
                recentWeeks.length
            ) {

                team.recentScore =
                    getAverage(
                        recentWeeks.map(
                            week =>
                                week.score
                        )
                    );

            }


            team.recentForm =
                recentWeeks
                    .map(
                        week =>
                            week.label
                    )
                    .join(" • ");

        });



        /*
            NORMALIZE LEAGUE-WIDE METRICS
        */

        const completedPoints =
            teams.map(
                team =>
                    team.completedPoints
            );


        const margins =
            teams.map(
                team =>
                    team.averageMargin
            );


        const consistencyValues =
            teams.map(
                team =>
                    team.consistencyRaw
            );


        const minPoints =
            Math.min(
                ...completedPoints
            );


        const maxPoints =
            Math.max(
                ...completedPoints
            );


        const minMargin =
            Math.min(
                ...margins
            );


        const maxMargin =
            Math.max(
                ...margins
            );


        const minConsistency =
            Math.min(
                ...consistencyValues
            );


        const maxConsistency =
            Math.max(
                ...consistencyValues
            );



        /*
            FINAL TAVERN POWER SCORE
        */

        teams.forEach(team => {


            const pointsScore =
                normalizeScore(

                    team.completedPoints,

                    minPoints,

                    maxPoints

                );


            const marginScore =
                normalizeScore(

                    team.averageMargin,

                    minMargin,

                    maxMargin

                );


            /*
                Lower standard deviation
                means more consistent.

                So this score is reversed.
            */

            let consistencyScore =
                50;


            if (
                team.weeklyScores.length >= 2
            ) {

                consistencyScore =

                    100 -

                    normalizeScore(

                        team.consistencyRaw,

                        minConsistency,

                        maxConsistency

                    );

            }


            team.powerScore =

                (
                    team.recordScore *
                    0.35
                )

                +

                (
                    pointsScore *
                    0.30
                )

                +

                (
                    team.recentScore *
                    0.15
                )

                +

                (
                    marginScore *
                    0.10
                )

                +

                (
                    consistencyScore *
                    0.10
                );


        });



        teams.sort(
            (a, b) => {


                if (
                    b.powerScore !==
                    a.powerScore
                ) {

                    return (
                        b.powerScore -
                        a.powerScore
                    );

                }


                return (
                    b.completedPoints -
                    a.completedPoints
                );

            }
        );



        container.innerHTML = "";


        displayRankings(
            teams,
            container,
            true
        );

    }

    catch (error) {

        console.error(
            "Error loading Tavern Power Rankings:",
            error
        );


        document.getElementById(
            "power-rankings-container"
        ).innerHTML = `

            <div class="rankings-notice">

                Unable to load
                Tavern Power Rankings.

            </div>

        `;

    }

}



function displayRankings(
    teams,
    container,
    showPowerScore
) {


    teams.forEach(
        (team, index) => {


            const rankingCard =
                document.createElement(
                    "div"
                );


            rankingCard.classList.add(
                "ranking-card"
            );


            let avatarHTML;


            if (
                team.avatar
            ) {

                avatarHTML = `

                    <img
                        class="ranking-avatar"
                        src="https://sleepercdn.com/avatars/thumbs/${team.avatar}"
                        alt="${team.managerName}"
                    >

                `;

            }

            else {

                avatarHTML = `

                    <div
                        class="ranking-avatar avatar-fallback"
                    >

                        ${team.managerName
                            .charAt(0)
                            .toUpperCase()}

                    </div>

                `;

            }


            const record =

                `${team.wins}-${team.losses}`

                +

                (
                    team.ties > 0
                        ?
                        `-${team.ties}`
                        :
                        ""
                );


            let powerHTML = `

                <div class="ranking-power preseason-power">

                    --

                    <span>
                        POWER
                    </span>

                </div>

            `;


            if (
                showPowerScore
            ) {

                powerHTML = `

                    <div class="ranking-power">

                        ${team.powerScore.toFixed(1)}

                        <span>
                            POWER
                        </span>

                        ${
                            team.recentForm
                                ?
                                `
                                <small>
                                    ${team.recentForm}
                                </small>
                                `
                                :
                                ""
                        }

                    </div>

                `;

            }


            rankingCard.innerHTML = `

                <div class="ranking-number">

                    #${index + 1}

                </div>


                ${avatarHTML}


                <div class="ranking-team-info">

                    <a
                        href="team.html?user=${team.userID}"
                        class="ranking-team-name"
                    >

                        ${team.teamName}

                    </a>


                    <div class="ranking-manager">

                        ${team.managerName}

                    </div>

                </div>


                <div class="ranking-record">

                    ${record}

                </div>


                <div class="ranking-points">

                    ${team.points.toFixed(2)}

                    <span>
                        PTS
                    </span>

                </div>


                ${powerHTML}

            `;


            container.appendChild(
                rankingCard
            );

        }
    );

}



loadPowerRankings();