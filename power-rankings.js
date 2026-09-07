const leagueID =
    "1380159618264621056";


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


    const container =
        document.getElementById(
            "power-rankings-container"
        );


    const usersByID = {};


    users.forEach(user => {

        usersByID[user.user_id] = user;

    });


    const teams =
        rosters.map(roster => {


            const user =
                usersByID[roster.owner_id];


            const teamName =
                user?.metadata?.team_name ||
                user?.display_name ||
                `Team ${roster.roster_id}`;


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


            return {

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

                points:
                    points

            };

        });


    const seasonHasStarted =
        teams.some(
            team =>
                team.wins > 0 ||
                team.losses > 0 ||
                team.points > 0
        );


    if (seasonHasStarted) {

        teams.sort((a, b) => {

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

        });

    } else {

        teams.sort((a, b) =>
            a.teamName.localeCompare(
                b.teamName
            )
        );

    }


    container.innerHTML = "";


    if (!seasonHasStarted) {

        const preseasonMessage =
            document.createElement("div");


        preseasonMessage.classList.add(
            "rankings-notice"
        );


        preseasonMessage.innerHTML = `

            🍻 Power Rankings are in preseason mode.

            <br>

            Real rankings will begin once
            Week 1 scoring starts.

        `;


        container.appendChild(
            preseasonMessage
        );

    }


    teams.forEach((team, index) => {


        const rankingCard =
            document.createElement("div");


        rankingCard.classList.add(
            "ranking-card"
        );


        let avatarHTML;


        if (team.avatar) {

            avatarHTML = `

                <img
                    class="ranking-avatar"
                    src="https://sleepercdn.com/avatars/thumbs/${team.avatar}"
                    alt="${team.managerName}"
                >

            `;

        } else {

            avatarHTML = `

                <div class="ranking-avatar avatar-fallback">

                    ${team.managerName
                        .charAt(0)
                        .toUpperCase()}

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

                ${team.wins}-${team.losses}

            </div>


            <div class="ranking-points">

                ${team.points.toFixed(2)}

                <span>
                    PTS
                </span>

            </div>

        `;


        container.appendChild(
            rankingCard
        );

    });

})

.catch(error => {

    console.error(
        "Error loading Power Rankings:",
        error
    );

});