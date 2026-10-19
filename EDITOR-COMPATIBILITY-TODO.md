# Editor compatibility follow-up (2026-10-18)

The earlier preview and documentation tasks are implemented. The offline editor now supports the website reading sequence, gallery splitting and occurrence metadata, a bilingual sandboxed preview matching website presentation, stable focus, block-removal undo and image-quality hints. See `VEHICLE-CONTENT-GUIDE.md` for current behavior.

The unmodified file:// entry and native folder pickers still need checks on available desktop Chrome/Edge platforms, especially Windows. Automated browser fixtures do not establish native-picker or assistive-technology compatibility. Build and publication remain separate confirmed operations; test writes only in disposable projects.
