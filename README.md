<div align="center">

# Suya Nakış

## Interactive Digital Ebru Studio

### Turkish Marbling × Creative Coding × Digital Cultural Heritage

An interactive browser-based studio inspired by the traditional Turkish art of Ebru.

<p align="center">

  <a href="https://doi.org/10.5281/zenodo.21123598">
    <img
      src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21123598-1682D4?style=for-the-badge"
      alt="DOI: 10.5281/zenodo.21123598"
    />
  </a>

  <a href="https://faramarzkowsari.github.io/suya-nakis/">
    <img
      src="https://img.shields.io/badge/LIVE_DEMO-OPEN_STUDIO-087F78?style=for-the-badge"
      alt="Live Demo"
    />
  </a>

  <a href="https://github.com/FaramarzKowsari/suya-nakis/releases/latest">
    <img
      src="https://img.shields.io/badge/RELEASE-v2.0.0-C9A548?style=for-the-badge"
      alt="Latest Release"
    />
  </a>

  <a href="https://github.com/FaramarzKowsari">
    <img
      src="https://img.shields.io/badge/AUTHOR-FARAMARZ_KOWSARI-092044?style=for-the-badge"
      alt="Faramarz Kowsari"
    />
  </a>

</p>


<br>

![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?logo=vite&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-F7DF1E?logo=javascript&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss&logoColor=white)
![HTML5 Canvas](https://img.shields.io/badge/HTML5-Canvas-E34F26?logo=html5&logoColor=white)
![GitHub Pages](https://img.shields.io/badge/Deployed-GitHub_Pages-222222?logo=github&logoColor=white)

</div>

---

## Live Application

Experience the complete interactive digital Ebru studio directly in your browser:

### [Launch Suya Nakış](https://faramarzkowsari.github.io/suya-nakis/)

No installation, account registration or external software is required.

---

## About the Project

**Suya Nakış** is an interactive digital art studio that explores the meeting point of traditional Turkish marbling, creative coding, procedural graphics, multimedia narration and cultural technology.

The project allows users to place coloured drops on a digital water surface, reshape them with stylus and comb tools, control brush precision, observe an automated 100-phase demonstration and export the completed artwork as a PNG image.

Rather than presenting Ebru as a static image, Suya Nakış transforms its visual logic into an interactive browser-based experience.

The project was developed as both:

- a creative software experiment;
- an interactive digital-art application;
- a cultural-technology portfolio project;
- an educational introduction to Turkish marbling;
- an example of digital cultural heritage preservation.

---

## Cultural Context

Ebru is the traditional Turkish art of creating colourful patterns by applying pigments to prepared water, shaping the floating colours and transferring the final composition onto paper.

The art of Ebru is included on UNESCO’s Representative List of the Intangible Cultural Heritage of Humanity.

**Official UNESCO reference:**

[ Ebru, Turkish Art of Marbling](https://ich.unesco.org/en/RL/ebru-turkish-art-of-marbling-00644)

> This repository is an independent cultural-technology project. It is not affiliated with or endorsed by UNESCO.

---

## Why Suya Nakış?

Traditional artistic practices can be introduced to new audiences through modern digital interfaces without reducing them to passive images.

Suya Nakış investigates how web technologies can:

- create interactive encounters with cultural heritage;
- introduce Turkish art to international audiences;
- connect creative coding with cultural storytelling;
- support digital education and experimentation;
- make artistic concepts accessible through browser-based tools;
- preserve cultural knowledge through contemporary digital formats.

The project does not attempt to replace physical Ebru practice. It offers a digital interpretation designed for exploration, education and creative interaction.

---

## Core Features

### Interactive Paint Drops

Each digital pigment drop is represented by a procedural contour containing hundreds of vertices.

When new colours or tools interact with an existing form, its geometry is recalculated to produce layered displacement and marbling-like visual effects.

### Drop Tool

Place coloured circular forms on the digital water surface.

Each new drop influences existing shapes and creates layered compositions.

### Stylus Tool

Drag through the artwork to stretch, pull and reshape the procedural contours.

### Comb Tool

Apply multiple parallel interactions to create repeated comb-like patterns across the digital surface.

### Adjustable Brush Precision

Control the size of the active tool to produce:

- small detailed forms;
- medium ornamental elements;
- large dominant shapes.

### Curated Colour Palette

Select colours from a compact visual palette designed for both traditional-looking and contemporary compositions.

### Touch and Mouse Interaction

The application supports:

- desktop mouse input;
- pointer interaction;
- touch-enabled devices;
- responsive browser layouts.

### PNG Artwork Export

Finished compositions can be exported directly from the browser as:

```text
ebru-masterpiece.png
```

---

## 100-Phase Master Demonstration

Suya Nakış includes an automated creative sequence that demonstrates the main interaction system.

| Stage | Number of Phases | Description |
|---|---:|---|
| Pigment placement | 40 | Introduces layered digital colour drops |
| Stylus interaction | 40 | Stretches and reshapes the existing contours |
| Comb interaction | 20 | Applies repeated parallel transformations |
| **Total** | **100** | Complete narrated digital performance |

The demonstration functions as both a visual presentation and a guided introduction to the project.

---

## Voice Narration

The project uses the browser’s **Web Speech API** to provide English voice narration during selected demonstrations and cultural-information sequences.

Narration availability may vary depending on:

- browser;
- operating system;
- installed speech voices;
- language and voice settings.

No prerecorded external audio service is required.

---

## Technical Approach

Suya Nakış uses a procedural geometry system inspired by the visual behaviour of pigment on water.

Each digital drop contains an ordered sequence of vertices. When a new drop, stylus movement or comb interaction affects the surface, the application recalculates vertex positions and redraws the resulting contours through the HTML5 Canvas API.

The interaction pipeline can be represented as:

```text
User Input
    ↓
Drop, Stylus or Comb Tool
    ↓
Vertex Transformation
    ↓
Procedural Shape Displacement
    ↓
Canvas Rendering
    ↓
Narration and User Feedback
    ↓
PNG Export
```

> Suya Nakış is a creative visual simulation. It is not presented as a scientific computational fluid dynamics solver.

---

## Technology Stack

| Technology | Purpose |
|---|---|
| React | Component-based user interface |
| JavaScript | Interaction and procedural logic |
| Vite | Development server and production build |
| HTML5 Canvas API | Dynamic artwork rendering |
| Tailwind CSS | Interface styling and responsive design |
| Lucide React | Interface icons |
| Web Speech API | Browser-based narration |
| GitHub Actions | Automated deployment workflow |
| GitHub Pages | Public application hosting |

---

## Project Structure

```text
suya-nakis/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── src/
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── CITATION.cff
├── README.md
├── index.html
├── package.json
├── postcss.config.js
├── robots.txt
├── sitemap.xml
├── tailwind.config.js
└── vite.config.js
```

---

## Running the Project Locally

### Requirements

Install:

- Node.js 18 or later
- npm
- a modern browser

### Clone the Repository

```bash
git clone https://github.com/FaramarzKowsari/suya-nakis.git
```

### Enter the Project Directory

```bash
cd suya-nakis
```

### Install Dependencies

```bash
npm install
```

### Start the Development Server

```bash
npm run dev
```

Vite will display the local development address in the terminal.

### Create a Production Build

```bash
npm run build
```

The generated production files will be stored in:

```text
dist/
```

### Preview the Production Build

```bash
npm run preview
```

---

## Browser Notes

For the most consistent experience, use a current version of:

- Google Chrome;
- Microsoft Edge;
- Mozilla Firefox;
- Safari.

Browser voice selection and pronunciation may differ because speech synthesis depends on locally available operating-system voices.

---

## Accessibility Considerations

The project currently provides:

- clear visual controls;
- pointer and touch input;
- browser-native narration;
- responsive interface behaviour;
- direct artwork export.

Planned accessibility improvements include:

- keyboard navigation;
- clearer focus indicators;
- adjustable narration controls;
- multilingual interface labels;
- reduced-motion preferences;
- improved screen-reader descriptions.

---

## Development Roadmap

Possible future improvements include:

- Turkish interface localization;
- Turkish voice narration;
- multilingual cultural explanations;
- undo and redo controls;
- editable project saving;
- high-resolution artwork export;
- additional Ebru pattern presets;
- automated tests;
- exhibition and gallery mode;
- educational lessons about traditional Ebru techniques;
- improved mobile interaction;
- downloadable composition history;
- optional generative-assistance tools.

---

## Author and Creator

### Faramarz Kowsari

Faramarz Kowsari is an author, Software Engineer and AI researcher based in Istanbul. Focusing on the intersection of technology, education, and personal growth, he has published over 80 digital titles on international platforms.

His areas of expertise span Artificial Intelligence, prompt engineering, modern trading strategies (Smart Money Concepts & algorithmic trading), as well as classical literature and mindfulness.

In addition to writing, he develops web-based educational tools and creates specialized instructional video content.

Suya Nakış forms part of his broader work at the intersection of software engineering, interactive education, digital publishing and cultural technology.

---

## Official Profiles & Repositories

- **Wikidata:**  
  [https://www.wikidata.org/wiki/Q140389378](https://www.wikidata.org/wiki/Q140389378)

- **ORCID:**  
  [https://orcid.org/0000-0003-1692-0453](https://orcid.org/0000-0003-1692-0453)

- **Google Scholar:**  
  [https://scholar.google.com/citations?user=G7tP5WMAAAAJ&hl=en](https://scholar.google.com/citations?user=G7tP5WMAAAAJ&hl=en)

- **GitHub:**  
  [https://github.com/FaramarzKowsari](https://github.com/FaramarzKowsari)

- **LinkedIn:**  
  [https://www.linkedin.com/in/faramarzkowsari](https://www.linkedin.com/in/faramarzkowsari)

- **Google Books:**  
  [https://play.google.com/store/search?q=Faramarz_Kowsari&c=books](https://play.google.com/store/search?q=Faramarz_Kowsari&c=books)

---

## Related Authorship Portfolio

A verified English-language bibliography documenting Faramarz Kowsari’s published works from 1997 to 2026 is available here:

### [The Published Works of Faramarz Kowsari](https://github.com/FaramarzKowsari/faramarz-kowsari-verified-bibliography)

---


## Citation
## Citation

This repository includes a machine-readable
[`CITATION.cff`](./CITATION.cff) file.

You can use GitHub’s **Cite this repository** menu or cite the permanently
archived Zenodo release:

> Kowsari, F. (2026). *Suya Nakış: Interactive Digital Ebru Studio*  
> Version 2.0.0. Zenodo.  
> https://doi.org/10.5281/zenodo.21123598

<p align="left">
  <a href="https://doi.org/10.5281/zenodo.21123598">
    <img
      src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.21123598-1682D4?style=flat-square"
      alt="DOI: 10.5281/zenodo.21123598"
    />
  </a>
</p>

<details>
<summary><strong>BibTeX citation</strong></summary>

```bibtex
@software{kowsari_2026_suya_nakis,
  author    = {Faramarz Kowsari},
  title     = {Suya Nakış: Interactive Digital Ebru Studio},
  version   = {2.0.0},
  year      = {2026},
  publisher = {Zenodo},
  doi       = {10.5281/zenodo.21123598},
  url       = {https://doi.org/10.5281/zenodo.21123598}
}
```

</details>

---

## Current Release

The latest public release is available at:

### [Suya Nakış 2.0 — Interactive Digital Ebru Studio](https://github.com/FaramarzKowsari/suya-nakis/releases/latest)

---

## Acknowledgement

This independent project was created with respect for the artists, teachers,
and cultural communities that have preserved and transmitted the art of Ebru
across generations.

Technology can expand access to cultural knowledge, but it cannot replace the
physical craft, material experience, and accumulated knowledge of traditional
practitioners.

---

## Support the Project

You can support Suya Nakış by:

- Starring the repository
- Sharing the live application
- Reporting technical issues
- Suggesting accessibility improvements
- Referencing the project in digital-art or cultural-technology research
- Introducing the project to educators, artists, and cultural institutions

---

<div align="center">

### Turkish Marbling Heritage Reimagined Through Creative Code

[Launch the Studio](https://faramarzkowsari.github.io/suya-nakis/) ·
[View the Release](https://github.com/FaramarzKowsari/suya-nakis/releases/latest) ·
[Visit the Author Profile](https://github.com/FaramarzKowsari)

<br><br>

Copyright © 2026 Faramarz Kowsari. All rights reserved.

</div>
