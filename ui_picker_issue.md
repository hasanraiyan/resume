# UI Bug: Model Picker Stacking & Layout Issues

The model selection interface in the Admin Chatbot settings has several visual and functional issues, specifically regarding how dropdown menus interact with other page elements.

## Identified Issues

### Affected Files

- `src/app/(admin)/admin/chatbot/page.js` (Layout and Z-Index)
- `src/components/CustomDropdown.js` (Dropdown component styling and logic)
- `src/models/ChatbotSettings.js` (Schema validation related to UI selection)

## Identified Issues

### 1. Stacking Context / Z-Index Conflict

The "Default Fallback Model" picker is partially hidden behind the "Widget Model Selection" section.

- **Cause**: The lower section (`Widget Model Selection`) uses `relative z-50`, while the upper section has no explicit z-index. Because the lower section comes later in the DOM, it takes priority and covers any overlapping dropdowns from the section above.
- **Visual Evidence**: The bottom of the model list is cut off or rendered "under" the role engine cards (Fast, Thinking, Pro).

### 2. Layout & Width Misalignment

In the "Default Fallback Model" section:

- The `Provider` and `Model` dropdowns are in a 2-column grid, but their widths are unconstrained, leading to a cramped UI on smaller screens.
- The dropdown list doesn't consistently align with the width of the parent button.

### 3. Visual Artifacts

- **Hover Indicator Bug**: There is a strange focus/circle artifact appearing on top of the selection (visible in screenshots).
- **Separation**: The white dropdown menu lacks a distinct border-shadow on the white background of the cards, making it hard to read.

### 4. Overflow & Clipping

The `AdminPageWrapper` or parent containers might have `overflow-hidden` properties that clip the absolute-positioned dropdowns, especially when many models are available.

## Proposed Fixes

1.  **Layer Management**:
    - Increase the z-index of the "Default Fallback Model" container (e.g., `z-50`) and ensure subsequent sections use a lower z-index (e.g., `z-40` or `z-30`) unless they are currently active/open.
    - Better yet, use a "portal" or ensure the parent containers of dropdowns have `relative` and appropriate z-indexes that increment _backwards_ (higher for top sections).

2.  **Dropdown Component Updates (`CustomDropdown.js`)**:
    - Improve the shadow and border of the `z-50` absolute container.
    - Check the GSAP hover indicator logic to ensure it doesn't create unwanted visual artifacts (like the black circle).

3.  **UI Feedback**:
    - Add a loading state inside the `Model` dropdown specifically while the provider's models are being fetched from the API.
