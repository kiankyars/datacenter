# Inside a Datacenter

A full-screen, scroll-driven Three.js field guide to datacenter equipment, inspired by the isometric voxel world at https://y-n10.com.

Run `npm run dev` and open the printed local URL. The authored static site is in `dist/`; no production build is needed. Three.js is vendored there with its license. Fonts load from Google Fonts with local system fallbacks.

Explore six chapters, select equipment, inspect an open server, and trace power, heat, and data. Scroll to travel through the landscape, drag horizontally to orbit, or use the arrow and chapter controls. Keys 1–6 select chapters. Longer equipment explanations open in a drawer. All equipment has a text-button equivalent. Animation respects reduced-motion preferences.

This is an illustrative mixed air/liquid-cooled facility, not an engineering design or live telemetry. Source links are included in equipment details and the About dialog.

`npm run check` validates JavaScript syntax. The WebMCP `explore_datacenter` tool uses the same actions as the visible controls and is optional when unsupported by the browser.
