# Vector-Star Probability Dynamics (VSPD)

A static, interactive educational website explaining the theory of Vector-Star Probability Dynamics, focusing on how finite measurement duration shapes quantum probability distributions.

## Overview

This website demonstrates how finite Δt measurement produces observed probability distributions without modifying quantum predictions. The interactive visualization shows the difference between instantaneous and finite-duration measurements.

## Features

- **Interactive Homepage**: Side-by-side visualization comparing standard quantum wave functions with Vector-Star representations
- **Δt Controls**: Slider to adjust measurement duration and toggle between measurement modes
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes
- **Educational Content**: Theory, comparisons, experiments, and about sections

## Structure

```
├── index.html          # Homepage with interactive visualization
├── theory.html         # Theory explanation
├── comparisons.html    # Comparison with other interpretations
├── experiments.html    # Experimental observability
├── about.html          # About and contact
├── css/
│   └── styles.css      # Main stylesheet with dark mode support
├── js/
│   ├── main.js         # General functionality and theme toggle
│   └── visualization.js # Interactive canvas animations
└── favicon.ico         # Site favicon
```

## Technology

- **HTML5**: Semantic markup
- **CSS3**: Responsive design with CSS Grid and Flexbox
- **Vanilla JavaScript**: Canvas-based interactive visualizations
- **No Dependencies**: Pure static site, no build process required

## Deployment

Simply upload all files to any static web hosting service:

1. **GitHub Pages**: Push to a GitHub repository and enable Pages
2. **Netlify**: Drag and drop the folder or connect via Git
3. **Vercel**: Deploy from Git repository
4. **Traditional Hosting**: Upload via FTP to any web server

The site is ready for deployment at `http://www.vectorstarprobabilitydynamics.com`

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Canvas support required for interactive visualizations
- Responsive design works on mobile devices

## Physics Safety

This educational visualization maintains physics safety by:
- Not claiming to disprove existing quantum theories
- Using terms like "reinterpretation" and "finite-duration measurement"
- Emphasizing compatibility with established predictions
- Focusing on educational value over speculative claims

## Development

To modify or extend the site:

1. Edit HTML files for content changes
2. Modify `css/styles.css` for styling updates
3. Update `js/visualization.js` for animation changes
4. Update `js/main.js` for general functionality

## License

Educational content for Vector-Star Probability Dynamics theory.