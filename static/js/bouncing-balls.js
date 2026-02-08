// Bouncing Balls Animation - Vector-Star Probability Dynamics
class BouncingBallsAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.balls = [];
        this.trails = [];
        this.collisionHistory = [];
        this.probabilityGrid = [];
        this.gridSize = 20;
        this.trailLength = 30;
        this.maxBalls = 50; // Increased default for better multi-ball collisions
        this.targetBallCount = 50;
        this.isRunning = true;
        this.showProbabilityCloud = false; // Toggle between vector stars and probability cloud
        this.gravitationalField = false; // Toggle gravitational field
        this.gravityStrength = 0.15; // Strength of gravitational pull
        this.gravityFieldWidth = 200; // Width of gravitational field on right side
        
        this.setupCanvas();
        this.createBalls();
        this.setupControls();
        this.animate();
    }
    
    setupCanvas() {
        this.canvas.width = 800;
        this.canvas.height = 500;
        
        // Optimize for many balls
        if (this.maxBalls > 100) {
            this.trailLength = 20; // Shorter trails for performance
            this.gridSize = 25; // Larger grid cells
        }
        this.canvas.style.border = '1px solid #e0e0e0';
        this.canvas.style.borderRadius = '5px';
        this.canvas.style.background = '#fafafa';
        
        // Initialize probability grid
        for (let x = 0; x < this.canvas.width; x += this.gridSize) {
            for (let y = 0; y < this.canvas.height; y += this.gridSize) {
                this.probabilityGrid.push({ x, y, density: 0 });
            }
        }
    }
    
    createBalls() {
        // Clear existing balls
        this.balls = [];
        
        // Adjust ball size based on count
        const baseRadius = this.maxBalls > 100 ? 5 : 8;
        const radiusVariation = this.maxBalls > 100 ? 2 : 4;
        
        for (let i = 0; i < this.maxBalls; i++) {
            this.balls.push({
                x: Math.random() * (this.canvas.width - 40) + 20,
                y: Math.random() * (this.canvas.height - 40) + 20,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                radius: baseRadius + Math.random() * radiusVariation,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                trail: []
            });
        }
    }
    
    setBallCount(count) {
        this.targetBallCount = count;
        this.maxBalls = count;
        
        // Optimize settings for many balls
        if (count > 100) {
            this.trailLength = 20;
            this.gridSize = 25;
        } else {
            this.trailLength = 30;
            this.gridSize = 20;
        }
        
        // Update display
        const display = document.getElementById('ball-count-display');
        if (display) {
            display.textContent = count;
        }
        
        // Adjust balls to match count
        if (this.balls.length < count) {
            // Add more balls
            const needed = count - this.balls.length;
            for (let i = 0; i < needed; i++) {
                this.balls.push({
                    x: Math.random() * (this.canvas.width - 40) + 20,
                    y: Math.random() * (this.canvas.height - 40) + 20,
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: 6 + Math.random() * 3, // Slightly smaller for many balls
                    color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    trail: []
                });
            }
        } else if (this.balls.length > count) {
            // Remove excess balls (remove from end)
            this.balls = this.balls.slice(0, count);
        }
    }
    
    updateBalls() {
        this.balls.forEach((ball, i) => {
            // Apply gravitational field if enabled
            if (this.gravitationalField) {
                const fieldStartX = this.canvas.width - this.gravityFieldWidth;
                
                // Check if ball is in gravitational field
                if (ball.x > fieldStartX) {
                    // Calculate distance from right edge (stronger gravity closer to edge)
                    const distanceFromEdge = this.canvas.width - ball.x;
                    const normalizedDistance = distanceFromEdge / this.gravityFieldWidth;
                    
                    // Apply gravitational acceleration (stronger near the edge)
                    const gravityAccel = this.gravityStrength * (1 - normalizedDistance * 0.5);
                    ball.vx += gravityAccel; // Pull toward right
                    
                    // Also apply slight vertical component (toward center)
                    const centerY = this.canvas.height / 2;
                    const verticalDist = ball.y - centerY;
                    ball.vy -= (verticalDist / this.canvas.height) * gravityAccel * 0.3;
                }
            }
            
            // Update position
            ball.x += ball.vx;
            ball.y += ball.vy;
            
            // Bounce off walls
            if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= this.canvas.width) {
                ball.vx = -ball.vx;
                ball.x = Math.max(ball.radius, Math.min(this.canvas.width - ball.radius, ball.x));
            }
            if (ball.y - ball.radius <= 0 || ball.y + ball.radius >= this.canvas.height) {
                ball.vy = -ball.vy;
                ball.y = Math.max(ball.radius, Math.min(this.canvas.height - ball.radius, ball.y));
            }
            
            // Add to trail (world-tube)
            ball.trail.push({ x: ball.x, y: ball.y });
            if (ball.trail.length > this.trailLength) {
                ball.trail.shift();
            }
            
            // Update probability grid
            const gridX = Math.floor(ball.x / this.gridSize);
            const gridY = Math.floor(ball.y / this.gridSize);
            const index = gridY * Math.floor(this.canvas.width / this.gridSize) + gridX;
            if (this.probabilityGrid[index]) {
                this.probabilityGrid[index].density = Math.min(1, this.probabilityGrid[index].density + 0.01);
            }
        });
        
        // Decay probability grid
        this.probabilityGrid.forEach(cell => {
            cell.density *= 0.995;
        });
        
        // Check collisions
        this.checkCollisions();
    }
    
    checkCollisions() {
        // First, handle all 2-ball collisions for physics
        for (let i = 0; i < this.balls.length; i++) {
            for (let j = i + 1; j < this.balls.length; j++) {
                const ball1 = this.balls[i];
                const ball2 = this.balls[j];
                
                const dx = ball2.x - ball1.x;
                const dy = ball2.y - ball1.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < ball1.radius + ball2.radius) {
                    // Simple elastic collision
                    const angle = Math.atan2(dy, dx);
                    const sin = Math.sin(angle);
                    const cos = Math.cos(angle);
                    
                    // Rotate velocities
                    const vx1 = ball1.vx * cos + ball1.vy * sin;
                    const vy1 = ball1.vy * cos - ball1.vx * sin;
                    const vx2 = ball2.vx * cos + ball2.vy * sin;
                    const vy2 = ball2.vy * cos - ball2.vx * sin;
                    
                    // Swap velocities
                    const finalVx1 = vx2;
                    const finalVx2 = vx1;
                    
                    // Rotate back
                    ball1.vx = finalVx1 * cos - vy1 * sin;
                    ball1.vy = vy1 * cos + finalVx1 * sin;
                    ball2.vx = finalVx2 * cos - vy2 * sin;
                    ball2.vy = vy2 * cos + finalVx2 * sin;
                    
                    // Separate balls
                    const overlap = (ball1.radius + ball2.radius) - distance;
                    const separationX = (dx / distance) * overlap * 0.5;
                    const separationY = (dy / distance) * overlap * 0.5;
                    ball1.x -= separationX;
                    ball1.y -= separationY;
                    ball2.x += separationX;
                    ball2.y += separationY;
                }
            }
        }
        
        // Now detect multi-ball collisions (5+ balls) for vector stars
        this.detectMultiBallCollisions();
    }
    
    detectMultiBallCollisions() {
        const collisionGroups = [];
        const processed = new Set();
        const proximityThreshold = 25; // Increased threshold to catch more balls in proximity
        
        // Find groups of balls that are all colliding with each other
        for (let i = 0; i < this.balls.length; i++) {
            if (processed.has(i)) continue;
            
            const group = [i];
            const toCheck = [i];
            
            while (toCheck.length > 0) {
                const currentIdx = toCheck.pop();
                const currentBall = this.balls[currentIdx];
                
                for (let j = 0; j < this.balls.length; j++) {
                    if (j === currentIdx || processed.has(j)) continue;
                    
                    const otherBall = this.balls[j];
                    const dx = otherBall.x - currentBall.x;
                    const dy = otherBall.y - currentBall.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    // Increased proximity threshold to catch more multi-ball collisions
                    if (distance < currentBall.radius + otherBall.radius + proximityThreshold) {
                        // Balls are close (within collision range + buffer)
                        if (!group.includes(j)) {
                            group.push(j);
                            toCheck.push(j);
                        }
                    }
                }
            }
            
            // Mark all in group as processed
            group.forEach(idx => processed.add(idx));
            
            // Only create vector star if 5+ balls are involved
            if (group.length >= 5) {
                collisionGroups.push(group);
            }
        }
        
        // Create vector stars for multi-ball collisions
        collisionGroups.forEach(group => {
            this.createMultiBallVectorStar(group);
        });
    }
    
    createMultiBallVectorStar(ballIndices) {
        // Calculate center of collision (average position of all colliding balls)
        let centerX = 0;
        let centerY = 0;
        const vectors = [];
        
        ballIndices.forEach(idx => {
            const ball = this.balls[idx];
            centerX += ball.x;
            centerY += ball.y;
            vectors.push({
                x: ball.x,
                y: ball.y,
                vx: ball.vx,
                vy: ball.vy
            });
        });
        
        centerX /= ballIndices.length;
        centerY /= ballIndices.length;
        
        // Store collision for visualization
        this.collisionHistory.push({
            x: centerX,
            y: centerY,
            vectors: vectors,
            age: 0,
            ballCount: ballIndices.length
        });
        
        // Keep more collisions visible (increased from 15 to 30)
        if (this.collisionHistory.length > 30) {
            this.collisionHistory.shift();
        }
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw probability cloud (faded background)
        this.drawProbabilityCloud();
        
        // Draw gravitational field visualization
        if (this.gravitationalField) {
            this.drawGravitationalField();
        }
        
        // Draw trails (world-tubes)
        this.drawTrails();
        
        // Draw vector stars or probability clouds from collisions
        if (this.showProbabilityCloud) {
            this.drawProbabilityClouds();
        } else {
            this.drawVectorStars();
        }
        
        // Draw balls
        this.balls.forEach(ball => {
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fillStyle = ball.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#333';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
    }
    
    drawTrails() {
        this.balls.forEach(ball => {
            if (ball.trail.length < 2) return;
            
            for (let i = 1; i < ball.trail.length; i++) {
                const prev = ball.trail[i - 1];
                const curr = ball.trail[i];
                const alpha = i / ball.trail.length * 0.4;
                
                this.ctx.beginPath();
                this.ctx.moveTo(prev.x, prev.y);
                this.ctx.lineTo(curr.x, curr.y);
                this.ctx.strokeStyle = `rgba(100, 150, 255, ${alpha})`;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        });
    }
    
    drawGravitationalField() {
        const fieldStartX = this.canvas.width - this.gravityFieldWidth;
        
        // Create gradient for gravitational field visualization
        const gradient = this.ctx.createLinearGradient(fieldStartX, 0, this.canvas.width, 0);
        gradient.addColorStop(0, 'rgba(255, 200, 0, 0.1)');
        gradient.addColorStop(0.5, 'rgba(255, 150, 0, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 100, 0, 0.3)');
        
        // Draw field background
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(fieldStartX, 0, this.gravityFieldWidth, this.canvas.height);
        
        // Draw field boundary
        this.ctx.strokeStyle = 'rgba(255, 150, 0, 0.5)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(fieldStartX, 0);
        this.ctx.lineTo(fieldStartX, this.canvas.height);
        this.ctx.stroke();
        this.ctx.setLineDash([]);
        
        // Draw label
        this.ctx.fillStyle = 'rgba(255, 150, 0, 0.8)';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Gravitational Field', fieldStartX + this.gravityFieldWidth / 2, 20);
    }
    
    drawVectorStars() {
        this.collisionHistory.forEach(collision => {
            collision.age++;
            if (collision.age > 120) return; // Fade out after 120 frames (longer visibility)
            
            const alpha = Math.max(0, 1 - (collision.age / 120));
            const ballCount = collision.ballCount || collision.vectors.length;
            
            // Get time dilation factor based on collision location
            const timeDilation = this.getTimeDilationFactor(collision.x, collision.y);
            
            // Draw center point of collision (larger and more visible)
            this.ctx.beginPath();
            this.ctx.arc(collision.x, collision.y, 8 * timeDilation, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 50, 50, ${alpha * 0.8})`;
            this.ctx.fill();
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
            
            // Calculate velocity range for scaling
            let minSpeed = Infinity;
            let maxSpeed = 0;
            collision.vectors.forEach(vector => {
                const speed = Math.sqrt(vector.vx * vector.vx + vector.vy * vector.vy);
                minSpeed = Math.min(minSpeed, speed);
                maxSpeed = Math.max(maxSpeed, speed);
            });
            const speedRange = maxSpeed - minSpeed || 1; // Avoid division by zero
            
            // Draw vectors radiating outward (vector star) with different sizes based on velocity
            // AND time dilation (smaller in gravitational field)
            collision.vectors.forEach(vector => {
                const vx = vector.vx;
                const vy = vector.vy;
                const speed = Math.sqrt(vx * vx + vy * vy);
                
                // Scale arrow length based on velocity (normalized to 20-80 pixel range)
                // Faster balls = longer arrows
                const normalizedSpeed = speedRange > 0 ? (speed - minSpeed) / speedRange : 0.5;
                const baseLength = 20;
                const maxLength = 80;
                let arrowLength = baseLength + (normalizedSpeed * (maxLength - baseLength));
                
                // Apply time dilation - vectors are smaller in gravitational field
                arrowLength *= timeDilation;
                
                // Arrow thickness also scales with speed (1-4px) and time dilation
                const arrowWidth = (1 + (normalizedSpeed * 3)) * timeDilation;
                
                // Normalize direction
                const normalizedVx = vx / (speed || 1);
                const normalizedVy = vy / (speed || 1);
                
                // Draw vector arrow
                this.ctx.beginPath();
                this.ctx.moveTo(collision.x, collision.y);
                this.ctx.lineTo(
                    collision.x + normalizedVx * arrowLength,
                    collision.y + normalizedVy * arrowLength
                );
                this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.9})`;
                this.ctx.lineWidth = arrowWidth;
                this.ctx.stroke();
                
                // Arrow head (scales with arrow length and time dilation)
                const angle = Math.atan2(normalizedVy, normalizedVx);
                const arrowHeadLength = (8 + (normalizedSpeed * 6)) * timeDilation;
                this.ctx.beginPath();
                this.ctx.moveTo(
                    collision.x + normalizedVx * arrowLength,
                    collision.y + normalizedVy * arrowLength
                );
                this.ctx.lineTo(
                    collision.x + normalizedVx * arrowLength - arrowHeadLength * Math.cos(angle - Math.PI / 6),
                    collision.y + normalizedVy * arrowLength - arrowHeadLength * Math.sin(angle - Math.PI / 6)
                );
                this.ctx.moveTo(
                    collision.x + normalizedVx * arrowLength,
                    collision.y + normalizedVy * arrowLength
                );
                this.ctx.lineTo(
                    collision.x + normalizedVx * arrowLength - arrowHeadLength * Math.cos(angle + Math.PI / 6),
                    collision.y + normalizedVy * arrowLength - arrowHeadLength * Math.sin(angle + Math.PI / 6)
                );
                this.ctx.strokeStyle = `rgba(255, 100, 100, ${alpha * 0.9})`;
                this.ctx.lineWidth = arrowWidth;
                this.ctx.stroke();
            });
            
            // Draw count indicator (also scaled by time dilation)
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            this.ctx.font = `bold ${Math.floor(16 * timeDilation)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(`${ballCount}`, collision.x, collision.y + 5);
            this.ctx.fillText(`${ballCount}`, collision.x, collision.y + 5);
        });
    }
    
    drawProbabilityClouds() {
        this.collisionHistory.forEach(collision => {
            collision.age++;
            if (collision.age > 120) return;
            
            const alpha = Math.max(0, 1 - (collision.age / 120));
            const ballCount = collision.ballCount || collision.vectors.length;
            
            // Get time dilation factor
            const timeDilation = this.getTimeDilationFactor(collision.x, collision.y);
            
            // Draw center point (scaled by time dilation)
            this.ctx.beginPath();
            this.ctx.arc(collision.x, collision.y, 8 * timeDilation, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 50, 50, ${alpha * 0.8})`;
            this.ctx.fill();
            
            // Create a gradient for the cloud
            const maxRadius = 100; // Maximum cloud radius
            const gradient = this.ctx.createRadialGradient(
                collision.x, collision.y, 0,
                collision.x, collision.y, maxRadius
            );
            
            // Calculate velocity statistics
            let totalSpeed = 0;
            let maxSpeed = 0;
            collision.vectors.forEach(vector => {
                const speed = Math.sqrt(vector.vx * vector.vx + vector.vy * vector.vy);
                totalSpeed += speed;
                maxSpeed = Math.max(maxSpeed, speed);
            });
            const avgSpeed = totalSpeed / collision.vectors.length;
            
            // Create cloud shape based on vector directions
            // Use multiple overlapping circles/gradients in the direction of each vector
            collision.vectors.forEach(vector => {
                const vx = vector.vx;
                const vy = vector.vy;
                const speed = Math.sqrt(vx * vx + vy * vy);
                const normalizedVx = vx / (speed || 1);
                const normalizedVy = vy / (speed || 1);
                
                // Scale cloud size based on speed (and time dilation)
                let cloudRadius = (30 + (speed * 5)) * timeDilation;
                const cloudIntensity = speed / (maxSpeed || 1);
                
                // Position cloud in the direction of the vector
                const offsetX = normalizedVx * (cloudRadius * 0.3);
                const offsetY = normalizedVy * (cloudRadius * 0.3);
                
                // Create gradient for this vector's contribution
                const vectorGradient = this.ctx.createRadialGradient(
                    collision.x + offsetX,
                    collision.y + offsetY,
                    0,
                    collision.x + offsetX,
                    collision.y + offsetY,
                    cloudRadius
                );
                
                vectorGradient.addColorStop(0, `rgba(150, 150, 255, ${alpha * cloudIntensity * 0.6})`);
                vectorGradient.addColorStop(0.5, `rgba(150, 150, 255, ${alpha * cloudIntensity * 0.3})`);
                vectorGradient.addColorStop(1, `rgba(150, 150, 255, 0)`);
                
                // Draw cloud blob
                this.ctx.beginPath();
                this.ctx.arc(
                    collision.x + offsetX,
                    collision.y + offsetY,
                    cloudRadius,
                    0,
                    Math.PI * 2
                );
                this.ctx.fillStyle = vectorGradient;
                this.ctx.fill();
            });
            
            // Draw overall cloud shape (combined effect, scaled by time dilation)
            const scaledMaxRadius = maxRadius * timeDilation;
            const overallGradient = this.ctx.createRadialGradient(
                collision.x, collision.y, 0,
                collision.x, collision.y, scaledMaxRadius
            );
            overallGradient.addColorStop(0, `rgba(150, 150, 255, ${alpha * 0.4})`);
            overallGradient.addColorStop(0.3, `rgba(150, 150, 255, ${alpha * 0.2})`);
            overallGradient.addColorStop(0.6, `rgba(150, 150, 255, ${alpha * 0.1})`);
            overallGradient.addColorStop(1, `rgba(150, 150, 255, 0)`);
            
            // Draw main cloud (scaled by time dilation)
            this.ctx.beginPath();
            this.ctx.arc(collision.x, collision.y, scaledMaxRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = overallGradient;
            this.ctx.fill();
            
            // Draw count indicator (scaled by time dilation)
            this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`;
            this.ctx.font = `bold ${Math.floor(16 * timeDilation)}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(`${ballCount}`, collision.x, collision.y + 5);
            this.ctx.fillText(`${ballCount}`, collision.x, collision.y + 5);
        });
    }
    
    drawProbabilityCloud() {
        this.probabilityGrid.forEach(cell => {
            if (cell.density > 0.01) {
                const alpha = Math.min(0.3, cell.density);
                this.ctx.fillStyle = `rgba(150, 150, 255, ${alpha})`;
                this.ctx.fillRect(cell.x, cell.y, this.gridSize, this.gridSize);
            }
        });
    }
    
    animate() {
        if (this.isRunning) {
            this.updateBalls();
            this.draw();
        }
        requestAnimationFrame(() => this.animate());
    }
    
    setupControls() {
        // Controls can be added here if needed
    }
    
    toggle() {
        this.isRunning = !this.isRunning;
        // Update button text will be handled by the interval in HTML
    }
    
    toggleProbabilityCloud() {
        this.showProbabilityCloud = !this.showProbabilityCloud;
    }
    
    toggleGravitationalField() {
        this.gravitationalField = !this.gravitationalField;
    }
    
    isInGravitationalField(x, y) {
        if (!this.gravitationalField) return false;
        const fieldStartX = this.canvas.width - this.gravityFieldWidth;
        return x > fieldStartX;
    }
    
    getTimeDilationFactor(x, y) {
        if (!this.gravitationalField) return 1.0;
        if (!this.isInGravitationalField(x, y)) return 1.0;
        
        // Calculate time dilation factor (stronger near the edge)
        const fieldStartX = this.canvas.width - this.gravityFieldWidth;
        const distanceFromEdge = this.canvas.width - x;
        const normalizedDistance = distanceFromEdge / this.gravityFieldWidth;
        
        // Time runs slower in stronger gravitational field
        // Factor ranges from 0.3 (at edge) to 0.8 (at field start)
        return 0.3 + (normalizedDistance * 0.5);
    }
    
    reset() {
        this.balls = [];
        this.trails = [];
        this.collisionHistory = [];
        this.probabilityGrid.forEach(cell => cell.density = 0);
        this.maxBalls = this.targetBallCount;
        this.createBalls();
    }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('bouncing-balls-canvas')) {
        window.animation = new BouncingBallsAnimation('bouncing-balls-canvas');
        
        // Sync slider with display
        const slider = document.getElementById('ball-count-slider');
        if (slider) {
            slider.addEventListener('input', function() {
                const display = document.getElementById('ball-count-display');
                if (display) {
                    display.textContent = this.value;
                }
            });
        }
    }
});
