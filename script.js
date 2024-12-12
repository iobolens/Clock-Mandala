// script.js - I'll split this into sections for clarity
const PATTERN_TYPES = {
    seconds: {
        color: '#60A5FA',
        glowColor: 'rgba(96, 165, 250, 0.6)',
        baseSize: 4,
        count: 60,
        speed: 1,
        shape: 'triangle'
    },
    minutes: {
        color: '#34D399',
        glowColor: 'rgba(52, 211, 153, 0.6)',
        baseSize: 8,
        count: 24,
        speed: 0.5,
        shape: 'hexagon'
    },
    hours: {
        color: '#F59E0B',
        glowColor: 'rgba(245, 158, 11, 0.6)',
        baseSize: 12,
        count: 12,
        speed: 0.25,
        shape: 'circle'
    }
};

class Pattern {
    constructor(type, radius, angle) {
        this.type = type;
        this.config = PATTERN_TYPES[type];
        this.radius = radius;
        this.angle = angle;
        this.scale = 1;
        this.opacity = 1;
        this.rotation = 0;
        this.decaying = false;
    }

    update(deltaTime, timeScale) {
        if (this.decaying) {
            this.opacity -= 0.02 * timeScale;
            this.scale += 0.01 * timeScale;
            return this.opacity > 0;
        }
        
        this.rotation += this.config.speed * timeScale;
        this.angle += (this.config.speed * timeScale) / this.radius;
        return true;
    }

    startDecay() {
        this.decaying = true;
    }

    draw(ctx, centerX, centerY) {
        const x = centerX + Math.cos(this.angle) * this.radius;
        const y = centerY + Math.sin(this.angle) * this.radius;
        
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(this.rotation);
        ctx.scale(this.scale, this.scale);
        ctx.globalAlpha = this.opacity;
        
        ctx.beginPath();
        
        if (this.config.shape === 'triangle') {
            this.drawTriangle(ctx, this.config.baseSize);
        } else if (this.config.shape === 'hexagon') {
            this.drawHexagon(ctx, this.config.baseSize);
        } else {
            ctx.arc(0, 0, this.config.baseSize, 0, Math.PI * 2);
        }
        
        ctx.fillStyle = this.config.color;
        ctx.shadowColor = this.config.glowColor;
        ctx.shadowBlur = 15;
        ctx.fill();
        ctx.restore();
    }

    drawTriangle(ctx, size) {
        ctx.beginPath();
        ctx.moveTo(0, -size);
        ctx.lineTo(size * Math.cos(Math.PI/6), size * Math.sin(Math.PI/6));
        ctx.lineTo(-size * Math.cos(Math.PI/6), size * Math.sin(Math.PI/6));
        ctx.closePath();
    }

    drawHexagon(ctx, size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = size * Math.cos(angle);
            const y = size * Math.sin(angle);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
    }
}

class TimePatternMachine {
    constructor() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        this.patterns = {
            seconds: [],
            minutes: [],
            hours: []
        };
        
        this.isRunning = true;
        this.timeDirection = 1;
        this.timeScale = 1;
        this.elapsedTime = 0;
        
        this.setupCanvas();
        this.setupControls();
        this.initializePatterns();
        this.animate();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        
        // Add blend mode to prevent white artifacts
        this.ctx.globalCompositeOperation = 'source-over';
    }

    setupControls() {
        document.getElementById('playPauseBtn').onclick = () => {
            this.isRunning = !this.isRunning;
            document.getElementById('playPauseBtn').textContent = this.isRunning ? '⏸️' : '▶️';
        };
        document.getElementById('resetBtn').onclick = () => this.reset();

        document.getElementById('timeScaleSlider').oninput = (e) => {
            this.timeScale = parseFloat(e.target.value);
            document.getElementById('timeScaleDisplay').textContent = this.timeScale.toFixed(1);
            this.updateLayerAnimations();
        };
    }

    initializePatterns() {
        Object.entries(PATTERN_TYPES).forEach(([type, config]) => {
            const baseRadius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
            for (let i = 0; i < config.count; i++) {
                const angle = (i / config.count) * Math.PI * 2;
                const radius = baseRadius * (type === 'seconds' ? 1 : type === 'minutes' ? 0.7 : 0.4);
                this.patterns[type].push(new Pattern(type, radius, angle));
            }
        });
    }

    updateLayerAnimations() {
        document.querySelectorAll('.layer').forEach(layer => {
            layer.style.animationDuration = `${60 / this.timeScale}s`;
            layer.style.animationDirection = this.timeDirection > 0 ? 'normal' : 'reverse';
        });
    }

    reset() {
        this.elapsedTime = 0;
        this.initializePatterns();
    }

    animate() {
        if (this.isRunning) {
            const deltaTime = 16 / 1000; // Convert to seconds
            this.elapsedTime += deltaTime * this.timeScale * this.timeDirection;
            
            // Update patterns
            Object.entries(this.patterns).forEach(([type, patterns]) => {
                this.patterns[type] = patterns.filter(pattern => 
                    pattern.update(deltaTime, this.timeScale));
            });

            // Add new patterns as needed
            this.maintainPatterns();

            // Update time display
            this.updateTimeDisplay();
        }

        // Clear and draw
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw patterns
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        Object.values(this.patterns).forEach(patterns => {
            patterns.forEach(pattern => pattern.draw(this.ctx, centerX, centerY));
        });

        requestAnimationFrame(() => this.animate());
    }

    maintainPatterns() {
        Object.entries(PATTERN_TYPES).forEach(([type, config]) => {
            const patterns = this.patterns[type];
            if (patterns.length < config.count) {
                const angle = Math.random() * Math.PI * 2;
                const baseRadius = Math.min(this.canvas.width, this.canvas.height) * 0.3;
                const radius = baseRadius * (type === 'seconds' ? 1 : type === 'minutes' ? 0.7 : 0.4);
                
                // Add new pattern
                this.patterns[type].push(new Pattern(type, radius, angle));
            }

            // Trigger decay based on time
            patterns.forEach(pattern => {
                if (!pattern.decaying) {
                    const shouldDecay = Math.random() < 0.01 * this.timeScale;
                    if (shouldDecay) {
                        pattern.startDecay();
                        
                        // Create pattern in next time unit if appropriate
                        const timeUnits = ['seconds', 'minutes', 'hours'];
                        const currentIndex = timeUnits.indexOf(type);
                        if (currentIndex < timeUnits.length - 1) {
                            const nextType = timeUnits[currentIndex + 1];
                            const nextRadius = baseRadius * (nextType === 'minutes' ? 0.7 : 0.4);
                            this.patterns[nextType].push(new Pattern(nextType, nextRadius, angle));
                        }
                    }
                }
            });
        });
    }

    updateTimeDisplay() {
        const ms = Math.abs(this.elapsedTime * 1000);
        const seconds = Math.floor((ms / 1000) % 60);
        const minutes = Math.floor((ms / (1000 * 60)) % 60);
        const hours = Math.floor((ms / (1000 * 60 * 60)) % 24);
        const days = Math.floor(ms / (1000 * 60 * 60 * 24));
        
        document.getElementById('elapsedTime').textContent = 
            `T${this.timeDirection > 0 ? '+' : '-'}${days}d ${hours}h ${minutes}m ${seconds}s`;
    }
}

// Initialize the TimeMachine when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting TimeMachine...');
    window.timeMachine = new TimePatternMachine();
});

class MandalaVisualizer {
    constructor() {
        this.canvas = document.getElementById('mandalaCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.isPlaying = false;
        this.timeScale = 1.0;
        
        // Timer settings
        this.totalTime = 300;
        this.remainingTime = this.totalTime;
        this.lastTime = null;
        
        // Color schemes
        this.colors = {
            hours: {
                primary: '220, 20, 20',    // Deep Red
                energy: '255, 40, 40',     // Bright Red
                glow: '255, 100, 100'      // Light Red
            },
            minutes: {
                primary: '255, 120, 20',   // Deep Orange
                energy: '255, 150, 40',    // Bright Orange
                glow: '255, 180, 100'      // Light Orange
            },
            seconds: {
                primary: '255, 200, 20',   // Golden Yellow
                energy: '255, 220, 40',    // Bright Yellow
                glow: '255, 240, 100'      // Light Yellow
            }
        };
        
        this.mandalaConfig = {
            baseRadius: 0.35,
            rotationSpeed: 0.001,
            currentRotation: 0,
            pulseSpeed: 0.002
        };
        
        this.particles = [];
        this.lastTimeValues = { hours: 0, minutes: 0, seconds: 0 };
        
        this.setupCanvas();
        this.setupControls();
        this.setupTimerInputs();
        this.drawInitialState();
    }

    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        this.ctx.globalCompositeOperation = 'source-over';
        this.canvas.style.background = 'transparent';
    }

    createParticles(x, y, radius, colorSet) {
        const particleCount = 20;
        const angleStep = (Math.PI * 2) / particleCount;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = i * angleStep + Math.random() * 0.2;
            const speed = 1 + Math.random() * 2;
            const distance = radius * (1 + Math.random() * 0.5);
            
            this.particles.push({
                x: x,
                y: y,
                targetX: x + Math.cos(angle) * distance,
                targetY: y + Math.sin(angle) * distance,
                size: 2 + Math.random() * 2,
                color: colorSet,
                life: 1.0,
                speed: speed
            });
        }
    }

    drawRay(ctx, centerX, centerY, radius, startAngle, endAngle, colorSet, intensity) {
        const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
        gradient.addColorStop(0, `rgba(${colorSet.primary}, ${intensity})`);
        gradient.addColorStop(0.6, `rgba(${colorSet.energy}, ${intensity * 0.7})`);
        gradient.addColorStop(1, `rgba(${colorSet.glow}, 0)`);

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
    }

    drawTimeUnit(centerX, centerY, radius, colorSet, value, maxValue, rotation) {
        const ctx = this.ctx;
        const rayCount = maxValue;
        const activeRays = value;
        const rayAngle = (Math.PI * 2) / rayCount;
        const pulsePhase = Date.now() * this.mandalaConfig.pulseSpeed;
        const pulseIntensity = 0.15 * Math.sin(pulsePhase) + 0.85;
        
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(rotation);

        for (let i = 0; i < rayCount; i++) {
            const intensity = i < activeRays ? pulseIntensity : 0.1;
            this.drawRay(
                ctx,
                0, 0,
                radius,
                i * rayAngle,
                (i + 0.8) * rayAngle,
                colorSet,
                intensity
            );
        }

        ctx.restore();
    }

    updateAndDrawParticles() {
        this.particles = this.particles.filter(particle => {
            particle.life -= 0.02;
            
            const dx = particle.targetX - particle.x;
            const dy = particle.targetY - particle.y;
            particle.x += dx * particle.speed * 0.05;
            particle.y += dy * particle.speed * 0.05;

            if (particle.life > 0) {
                const ctx = this.ctx;
                const gradient = ctx.createRadialGradient(
                    particle.x, particle.y, 0,
                    particle.x, particle.y, particle.size
                );
                
                gradient.addColorStop(0, `rgba(${particle.color.energy}, ${particle.life})`);
                gradient.addColorStop(1, `rgba(${particle.color.glow}, 0)`);
                
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                ctx.fillStyle = gradient;
                ctx.fill();
                
                return true;
            }
            return false;
        });
    }

    drawMandala() {
        const ctx = this.ctx;
        const center = this.canvas.width / 2;
        const baseRadius = this.canvas.width * this.mandalaConfig.baseRadius;
        
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const hours = Math.floor(this.remainingTime / 3600);
        const minutes = Math.floor((this.remainingTime % 3600) / 60);
        const seconds = Math.floor(this.remainingTime % 60);
        
        // Check for transitions
        if (hours !== this.lastTimeValues.hours) {
            this.createParticles(center, center, baseRadius, this.colors.hours);
        }
        if (minutes !== this.lastTimeValues.minutes) {
            this.createParticles(center, center, baseRadius * 0.75, this.colors.minutes);
        }
        if (seconds !== this.lastTimeValues.seconds) {
            this.createParticles(center, center, baseRadius * 0.5, this.colors.seconds);
        }
        
        this.lastTimeValues = { hours, minutes, seconds };

        // Draw time units
        if (hours > 0) {
            this.drawTimeUnit(
                center, center,
                baseRadius,
                this.colors.hours,
                hours,
                24,
                this.mandalaConfig.currentRotation
            );
        }

        if (minutes > 0) {
            this.drawTimeUnit(
                center, center,
                baseRadius * 0.75,
                this.colors.minutes,
                minutes,
                60,
                -this.mandalaConfig.currentRotation * 1.5
            );
        }

        this.drawTimeUnit(
            center, center,
            baseRadius * 0.5,
            this.colors.seconds,
            seconds,
            60,
            this.mandalaConfig.currentRotation * 2
        );

        this.updateAndDrawParticles();
        
        this.mandalaConfig.currentRotation += this.mandalaConfig.rotationSpeed * 
            (1 + (1 - this.remainingTime / this.totalTime) * 2);
    }

    setupTimerInputs() {
        const setTimerBtn = document.getElementById('setTimerBtn');
        
        setTimerBtn.addEventListener('click', () => {
            const hours = parseInt(document.getElementById('hoursInput').value) || 0;
            const minutes = parseInt(document.getElementById('minutesInput').value) || 0;
            const seconds = parseInt(document.getElementById('secondsInput').value) || 0;
            
            this.totalTime = hours * 3600 + minutes * 60 + seconds;
            this.remainingTime = this.totalTime;
            this.lastTime = null;
            this.isPlaying = false;
            this.decayFragments = [];
            this.mandalaConfig.currentRotation = 0;
            
            document.getElementById('playPauseBtn').textContent = '▶️';
            this.drawInitialState();
        });
    }

    animate() {
        if (this.isPlaying) {
            const currentTime = Date.now();
            const deltaTime = (currentTime - (this.lastTime || currentTime)) / 1000 * this.timeScale;
            this.lastTime = currentTime;
            
            if (this.remainingTime > 0) {
                this.remainingTime = Math.max(0, this.remainingTime - deltaTime);
                this.drawMandala();
                this.updateTimer();
                requestAnimationFrame(() => this.animate());
            } else {
                this.isPlaying = false;
                document.getElementById('playPauseBtn').textContent = '▶️';
            }
        }
    }

    setupControls() {
        const playPauseBtn = document.getElementById('playPauseBtn');
        const resetBtn = document.getElementById('resetBtn');
        const timeScaleSlider = document.getElementById('timeScaleSlider');
        
        playPauseBtn.addEventListener('click', () => {
            this.isPlaying = !this.isPlaying;
            playPauseBtn.textContent = this.isPlaying ? '⏸️' : '▶️';
            
            if (this.isPlaying && !this.lastTime) {
                this.lastTime = Date.now();
                this.animate();
            }
        });
        
        resetBtn.addEventListener('click', () => {
            this.remainingTime = this.totalTime;
            this.lastTime = null;
            this.isPlaying = false;
            playPauseBtn.textContent = '▶️';
            this.drawInitialState();
        });
        
        timeScaleSlider.addEventListener('input', (e) => {
            this.timeScale = parseFloat(e.target.value);
            document.getElementById('timeScaleDisplay').textContent = this.timeScale.toFixed(1);
        });
    }

    drawInitialState() {
        this.drawMandala();
        this.updateTimer();
    }

    updateTimer() {
        if (this.isPlaying && this.remainingTime > 0) {
            const currentTime = Date.now();
            const delta = (currentTime - this.lastTime) / 1000 * this.timeScale;
            this.lastTime = currentTime;
            
            this.remainingTime = Math.max(0, this.remainingTime - delta);
            
            if (this.remainingTime === 0) {
                this.isPlaying = false;
                document.getElementById('playPauseBtn').textContent = '▶️';
            }
        }

        const hours = Math.floor(this.remainingTime / 3600);
        const minutes = Math.floor((this.remainingTime % 3600) / 60);
        const seconds = Math.floor(this.remainingTime % 60);
        
        document.getElementById('elapsedTime').textContent = 
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
}

// Initialize when the page loads
window.addEventListener('load', () => {
    new MandalaVisualizer();
});