# Prompt By Prompt Arcade

Prompt By Prompt Arcade is an open-source web-based arcade built using "Vibe Coding" with Gemini AI. The project aims to create a shared-screen experience where a computer acts as the arcade cabinet (host) and users connect their smartphones as controllers.

## Project Vision
This arcade is built prompt-by-prompt. While AI is used for coding assistance, the project is entirely hard-coded. There is no AI logic within the games themselves. The goal is a clean, physics-based, and visually engaging experience.

## AI Methodology
This project uses a specific set of system instructions to guide the AI development process. These rules ensure code consistency, professional documentation, and adherence to the project's visual constraints. You can view these instructions in [AI_INSTRUCTIONS.md](./AI_INSTRUCTIONS.md).

## Technical Stack
- Visuals: P5.js
- Physics: Matter.js
- Networking: Peer.js (Mobile-to-Screen communication)
- Languages: HTML5, CSS3, Vanilla JavaScript
- Hosting: GitHub Pages

## Project Constraints
- No Emojis: All visuals and documentation must avoid the use of emojis.
- Hard-Coded: Every game mechanic is explicitly defined in the source code.
- Mobile Input: Every game must support a mobile-web controller interface.

## Dev Logs
The development journey of this arcade is documented on YouTube. You can follow the progress and learn about the vibe coding process here:
https://youtube.com/@cadengamacheai?sub_confirmation=1

## Support the Developer
If you find this project helpful or enjoy the dev logs, you can support the ongoing development of the Prompt By Prompt Arcade via Patreon:
https://www.patreon.com/CadenGamache/Membership

## How It Works
1. Host: Open the main arcade URL on a computer or TV.
2. Connect: Use a smartphone to connect via the generated Peer.js ID or QR code.
3. Play: Control the on-screen action using the custom mobile interface.

## License
This project is licensed under the Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0) license. You are free to share and adapt the code for personal and educational use, but you are strictly prohibited from selling this project or using it for commercial purposes.
