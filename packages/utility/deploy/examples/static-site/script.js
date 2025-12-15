// Display current timestamp
document.getElementById('timestamp').textContent = new Date().toLocaleString();

// Click counter
let clicks = 0;
const clickBtn = document.getElementById('clickBtn');
const clickCount = document.getElementById('clickCount');

clickBtn.addEventListener('click', () => {
    clicks++;
    clickCount.textContent = `Clicks: ${clicks}`;

    // Add animation
    clickBtn.style.transform = 'scale(0.95)';
    setTimeout(() => {
        clickBtn.style.transform = 'scale(1)';
    }, 100);

    // Celebrate milestones
    if (clicks === 10) {
        alert('🎉 10 clicks! You\'re on fire!');
    } else if (clicks === 50) {
        alert('🔥 50 clicks! Unstoppable!');
    } else if (clicks === 100) {
        alert('💯 100 clicks! Legendary!');
    }
});

// Log to console
console.log('⚡ SiteFast static site loaded successfully!');
console.log('Deployment time:', new Date().toISOString());
