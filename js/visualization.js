// Interactive visualization for Vector-Star Probability Dynamics

class VSPDVisualization {
    constructor() {
        this.canvasWidth = 400;
        this.canvasHeight = 400;
        this.centerX = this.canvasWidth / 2;
        this.centerY = this.canvasHeight / 2;

        // Initialize canvases
        this.waveFunctionCanvas = document.getElementById('wave-function-canvas');
        this.vectorStarCanvas = document.getElementById('vector-star-canvas');

        if (!this.waveFunctionCanvas || !this.vectorStarCanvas) {
            console.error('Canvas elements not found');
            return;
        }

        this.waveFunctionCtx = this.waveFunctionCanvas.getContext('2d');
        this.vectorStarCtx = this.vectorStarCanvas.getContext('2d');

        // Set canvas sizes
        this.waveFunctionCanvas.width = this.canvasWidth;
        this.waveFunctionCanvas.height = this.canvasHeight;
        this.vectorStarCanvas.width = this.canvasWidth;
        this.vectorStarCanvas.height = this.canvasHeight;

        // Parameters
        this.deltaT = 2.0; // Measurement duration
        this.isInstantaneous = false; // Toggle state
        this.animationId = null;
        this.time = 0; // For subtle animations
        this.lastTextUpdate = 0; // For throttling text updates

        // Colors
        this.waveFunctionColor = '#4a90e2';
        this.vectorStarColor = '#e74c3c';
        this.measurementWindowColor = 'rgba(255, 193, 7, 0.3)';

        // Bind methods
        this.animate = this.animate.bind(this);
        this.updateVisualization = this.updateVisualization.bind(this);

        // Initialize
        this.initControls();
        this.startAnimation();
    }

    initControls() {
        // Δt slider
        const deltaTSlider = document.getElementById('delta-t-slider');
        const deltaTValue = document.getElementById('delta-t-value');

        if (deltaTSlider && deltaTValue) {
            deltaTSlider.addEventListener('input', (e) => {
                this.deltaT = parseFloat(e.target.value);
                deltaTValue.textContent = this.deltaT.toFixed(1) + ' units';
                this.updateVisualization();
            });
        }

        // Measurement mode toggle
        const measurementToggle = document.getElementById('measurement-toggle');
        const toggleLabel = document.getElementById('toggle-label');

        if (measurementToggle && toggleLabel) {
            measurementToggle.addEventListener('change', (e) => {
                this.isInstantaneous = !e.target.checked;
                toggleLabel.textContent = e.target.checked
                    ? 'Finite Δt measurement (physical)'
                    : 'Instantaneous measurement (idealized)';
                this.updateVisualization();
            });
        }

        // Reset button
        const resetButton = document.getElementById('reset-button');
        if (resetButton) {
            resetButton.addEventListener('click', () => {
                // Reset to default values
                this.deltaT = 2.0;
                this.isInstantaneous = false;

                // Update UI elements
                deltaTSlider.value = this.deltaT;
                deltaTValue.textContent = this.deltaT.toFixed(1) + ' units';
                measurementToggle.checked = !this.isInstantaneous;
                toggleLabel.textContent = 'Finite Δt measurement (physical)';

                // Update visualization
                this.updateVisualization();
            });
        }
    }

    startAnimation() {
        this.animate();
    }

    animate() {
        this.updateVisualization();
        this.animationId = requestAnimationFrame(this.animate);
    }

    // Add subtle animation to make the visualization more engaging
    addSubtleMotion() {
        // Add slight random motion to vector paths for more dynamic feel
        if (!this.isInstantaneous) {
            this.time = (this.time || 0) + 0.02;
            // This creates a subtle breathing effect
        }
    }

    updateVisualization() {
        // Add subtle motion for dynamic feel
        this.addSubtleMotion();

        // Clear canvases
        this.clearCanvas(this.waveFunctionCtx);
        this.clearCanvas(this.vectorStarCtx);

        // Draw measurement window overlay if finite Δt
        if (!this.isInstantaneous) {
            this.drawMeasurementWindow();
        }

        // Draw wave function visualization
        this.drawWaveFunction();

        // Draw vector-star visualization
        this.drawVectorStar();

        // Update explanation text (throttled to avoid excessive updates)
        if (!this.lastTextUpdate || Date.now() - this.lastTextUpdate > 100) {
            this.updateExplanationText();
            this.lastTextUpdate = Date.now();
        }
    }

    clearCanvas(ctx) {
        ctx.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
    }

    drawMeasurementWindow() {
        // Draw measurement window as a shaded temporal slice
        const windowHeight = this.deltaT * 20; // Scale for visualization
        const windowY = this.centerY - windowHeight / 2;

        // Wave function canvas
        this.waveFunctionCtx.fillStyle = this.measurementWindowColor;
        this.waveFunctionCtx.fillRect(0, windowY, this.canvasWidth, windowHeight);

        // Vector star canvas
        this.vectorStarCtx.fillStyle = this.measurementWindowColor;
        this.vectorStarCtx.fillRect(0, windowY, this.canvasWidth, windowHeight);
    }

    drawWaveFunction() {
        const ctx = this.waveFunctionCtx;

        // Draw axes and labels
        this.drawAxes(ctx, 'Position', 'Probability Density |ψ|²');

        // Draw a Gaussian wave packet as |ψ|²
        const sigma = this.isInstantaneous ? 30 : 30 + this.deltaT * 10;
        const amplitude = 100;

        ctx.strokeStyle = this.waveFunctionColor;
        ctx.lineWidth = 2;
        ctx.beginPath();

        for (let x = 0; x < this.canvasWidth; x += 2) {
            const dx = x - this.centerX;
            const probabilityDensity = amplitude * Math.exp(-dx * dx / (2 * sigma * sigma));
            const y = this.centerY - probabilityDensity;

            if (x === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }

        ctx.stroke();

        // Fill the area under the curve
        ctx.fillStyle = this.waveFunctionColor + '20'; // Semi-transparent
        ctx.beginPath();
        ctx.moveTo(0, this.centerY);

        for (let x = 0; x < this.canvasWidth; x += 2) {
            const dx = x - this.centerX;
            const probabilityDensity = amplitude * Math.exp(-dx * dx / (2 * sigma * sigma));
            const y = this.centerY - probabilityDensity;
            ctx.lineTo(x, y);
        }

        ctx.lineTo(this.canvasWidth, this.centerY);
        ctx.closePath();
        ctx.fill();

        // Add measurement markers
        if (this.isInstantaneous) {
            ctx.fillStyle = this.waveFunctionColor;
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, 4, 0, 2 * Math.PI);
            ctx.fill();

            // Add label
            ctx.fillStyle = '#333333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Deterministic outcome', this.centerX, this.centerY - 15);
        } else {
            // Add spread indicator
            ctx.strokeStyle = '#ff6b6b';
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.arc(this.centerX, this.centerY, sigma, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.setLineDash([]);

            // Add label
            ctx.fillStyle = '#333333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`Spread: ±${(sigma/10).toFixed(1)} units`, this.centerX, this.centerY - sigma - 10);
        }
    }

    drawVectorStar() {
        const ctx = this.vectorStarCtx;

        // Draw axes and labels
        this.drawAxes(ctx, 'Position', 'Momentum/Energy');

        // Add explanatory text
        ctx.fillStyle = '#666666';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Micro-paths during measurement', this.centerX, 30);

        // Number of micro-paths increases with Δt
        const numPaths = this.isInstantaneous ? 1 : Math.max(3, Math.floor(this.deltaT * 2));
        const spreadAngle = this.isInstantaneous ? 0 : this.deltaT * 0.3;

        for (let i = 0; i < numPaths; i++) {
            const baseAngle = (i / numPaths) * Math.PI * 2;
            const angle = baseAngle + (Math.random() - 0.5) * spreadAngle + Math.sin(this.time + i) * 0.1;
            const baseLength = this.isInstantaneous ? 80 : 80 + this.deltaT * 20;
            const length = baseLength + Math.random() * 40 + Math.sin(this.time * 2 + i) * 5;

            const endX = this.centerX + Math.cos(angle) * length;
            const endY = this.centerY + Math.sin(angle) * length;

            // Draw vector with fading opacity
            const opacity = this.isInstantaneous ? 1.0 : Math.max(0.2, 1.0 - (this.deltaT - 1) * 0.1);
            ctx.strokeStyle = this.vectorStarColor;
            ctx.globalAlpha = opacity;

            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(this.centerX, this.centerY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Draw arrowhead
            const arrowSize = 8;
            const angle1 = angle + Math.PI * 0.8;
            const angle2 = angle - Math.PI * 0.8;

            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - Math.cos(angle1) * arrowSize, endY - Math.sin(angle1) * arrowSize);
            ctx.moveTo(endX, endY);
            ctx.lineTo(endX - Math.cos(angle2) * arrowSize, endY - Math.sin(angle2) * arrowSize);
            ctx.stroke();
        }

        ctx.globalAlpha = 1.0;

        // Draw center point
        ctx.fillStyle = this.vectorStarColor;
        ctx.beginPath();
        ctx.arc(this.centerX, this.centerY, 4, 0, 2 * Math.PI);
        ctx.fill();

        // Add explanatory labels
        ctx.fillStyle = '#333333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';

        if (this.isInstantaneous) {
            ctx.fillText('Single micro-path', this.centerX, this.centerY + 80);
            ctx.fillText('(ideal measurement)', this.centerX, this.centerY + 95);
        } else {
            ctx.fillText(`${numPaths} micro-paths`, this.centerX, this.centerY + 80);
            ctx.fillText(`(Δt = ${this.deltaT.toFixed(1)})`, this.centerX, this.centerY + 95);
        }

        // Add convergence point label
        ctx.fillStyle = '#666666';
        ctx.font = '11px Arial';
        ctx.fillText('Measurement outcome', this.centerX, this.centerY - 15);
    }

    updateExplanationText() {
        const explanationElement = document.getElementById('explanation-text');
        if (!explanationElement) return;

        let explanation = '';

        if (this.isInstantaneous) {
            explanation = '🔵 INSTANTANEOUS MEASUREMENT MODE: The quantum wave function predicts a single, deterministic outcome. No uncertainty arises from the measurement process itself - this represents the ideal mathematical limit.';
        } else {
            const spreadLevel = this.deltaT < 2 ? 'slight' : this.deltaT < 5 ? 'moderate' : 'significant';
            const pathCount = Math.max(3, Math.floor(this.deltaT * 2));

            explanation = `🟡 FINITE Δt MEASUREMENT (Δt = ${this.deltaT.toFixed(1)}): ` +
                `During this ${spreadLevel} measurement duration, the quantum system evolves through ${pathCount} possible micro-paths simultaneously. ` +
                `This creates the observed probability distribution without requiring intrinsic indeterminism in the underlying physics. ` +
                `The measurement window allows quantum uncertainty to emerge naturally.`;
        }

        explanationElement.textContent = explanation;
    }

    drawAxes(ctx, xLabel, yLabel) {
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        ctx.font = '12px Arial';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'center';

        // Draw axes
        ctx.beginPath();
        ctx.moveTo(50, this.centerY);
        ctx.lineTo(this.canvasWidth - 50, this.centerY);
        ctx.moveTo(this.centerX, 50);
        ctx.lineTo(this.centerX, this.canvasHeight - 50);
        ctx.stroke();

        // X-axis label
        ctx.fillText(xLabel, this.centerX, this.canvasHeight - 20);

        // Y-axis label (rotated)
        ctx.save();
        ctx.translate(20, this.centerY);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(yLabel, 0, 0);
        ctx.restore();

        // Tick marks
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 1;
        for (let i = -2; i <= 2; i++) {
            const x = this.centerX + i * 50;
            const y = this.centerY + i * 50;

            // X ticks
            ctx.beginPath();
            ctx.moveTo(x, this.centerY - 5);
            ctx.lineTo(x, this.centerY + 5);
            ctx.stroke();

            // Y ticks
            ctx.beginPath();
            ctx.moveTo(this.centerX - 5, y);
            ctx.lineTo(this.centerX + 5, y);
            ctx.stroke();
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// Initialize visualization when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize on homepage
    if (document.getElementById('wave-function-canvas')) {
        window.vspdVisualization = new VSPDVisualization();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', function() {
    if (window.vspdVisualization) {
        window.vspdVisualization.destroy();
    }
});