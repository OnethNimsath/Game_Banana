var quest = "";
        var solution = -1;
        var lives = 3;

        function newgame() {
            lives = 3;
            updateLivesDisplay();
            startup();
        }

        function handleInput() {
            let inp = document.getElementById("input");
            let note = document.getElementById("note");
            if (parseInt(inp.value) === solution) {
                note.innerHTML = 'Correct!';
                document.getElementById('newGameButtonContainer').innerHTML = '<button class="button-62" onclick="newgame()">New Game?</button>';
            } else {
                lives--;
                updateLivesDisplay();
                if (lives === 0) {
                    note.innerHTML = "Game Over!";
                    document.getElementById('newGameButtonContainer').innerHTML = '<button class="button-62" onclick="newgame()">New Game?</button>';
                    lives = 3;
                    fetchText();
                    updateLivesDisplay(); // Update lives display immediately after reset
                } else {
                    note.innerHTML = "Not Correct!";
                }
            }
        }
        function updateLivesDisplay() {
          document.getElementById('lives').textContent = "Lives: " + lives;
        }

        async function fetchText() {
            try {
                let response = await fetch('https://marcconrad.com/uob/banana/api.php');
                let data = await response.text();
                startQuest(data);
            } catch (error) {
                document.getElementById("note").innerHTML = "Error loading question. Try again.";
            }
        }

        function startQuest(data) {
            var parsed = JSON.parse(data);
            quest = parsed.question;
            solution = parsed.solution;
            let img = document.getElementById("quest");
            img.src = quest;
            let note = document.getElementById("note");
            note.innerHTML = "Quest is ready.";
        }

        function startup() {
            fetchText();
            document.getElementById("input").value = "";
            document.getElementById('newGameButtonContainer').innerHTML = '<button class="button-62" onclick="newgame()">New Game?</button>';
        }

        // Randomize floating bananas
const floatingBananas = document.querySelectorAll('.floating-banana');
floatingBananas.forEach(banana => {
    const randomTop = Math.random() * 100; // Random percentage
    const randomLeft = Math.random() * 100;
    const randomDelay = Math.random() * 5; // Random delay up to 5 seconds

    banana.style.top = `${randomTop}%`;
    banana.style.left = `${randomLeft}%`;
    banana.style.animationDelay = `${randomDelay}s`;
});

// Randomize falling bananas
const fallingBananas = document.querySelectorAll('.falling-banana');
fallingBananas.forEach(banana => {
    const randomLeft = Math.random() * 100;
    const randomDelay = Math.random() * 7;

    banana.style.left = `${randomLeft}%`;
    banana.style.animationDelay = `${randomDelay}s`;
});

startup();