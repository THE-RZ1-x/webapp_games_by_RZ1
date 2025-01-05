document.querySelectorAll('.game-button').forEach((button, index) => {
    button.addEventListener('click', () => {
        console.log(`Game ${index + 1} clicked!`);
    });
});
