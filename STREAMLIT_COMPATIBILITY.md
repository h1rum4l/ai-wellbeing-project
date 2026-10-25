# Python Streamlit Compatibility Guide: Liquid Glass Theme & Logic

This guide provides drop-in Python Streamlit code enhancements to match the **Liquid Glass (Dark Blue + Cyan)** design system, login protection, and interactive breathing exercises directly in your Python Streamlit application.

> **Note on Source File Updates**:  
> If you would like these changes automatically merged into your Python `.py` source files, please upload your latest project ZIP file and we will apply the exact patches to your repository structure.

---

## 1. Streamlit Liquid Glass Configuration (`.streamlit/config.toml`)

Update or create `.streamlit/config.toml`:

```toml
[theme]
base = "dark"
primaryColor = "#22D3EE"
backgroundColor = "#050B14"
secondaryBackgroundColor = "#0A1324"
textColor = "#E2E8F0"
font = "sans serif"

[server]
port = 8501
enableCORS = false
```

---

## 2. Liquid Glass Theme Injector (`ui/theme.py`)

Add this function to `ui/theme.py` to inject the deep midnight navy and translucent cyan glass styles:

```python
import streamlit as st

def apply_liquid_glass_theme():
    st.markdown("""
    <style>
    /* Dark midnight navy canvas with ambient cyan gradients */
    .stApp {
        background: #050B14;
        background-image: 
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(6, 182, 212, 0.15), transparent),
            radial-gradient(ellipse 60% 40% at 90% 80%, rgba(14, 165, 233, 0.08), transparent);
        background-attachment: fixed;
        color: #E2E8F0;
    }

    /* Liquid Glass Cards */
    div[data-testid="stVerticalBlock"] > div[style*="background"] {
        background: rgba(10, 19, 36, 0.6) !important;
        backdrop-filter: blur(16px) !important;
        -webkit-backdrop-filter: blur(16px) !important;
        border: 1px solid rgba(34, 211, 238, 0.2) !important;
        border-radius: 18px !important;
        box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.45) !important;
    }

    /* Cyan Glowing Buttons */
    .stButton > button {
        background: linear-gradient(135deg, rgba(8, 145, 178, 0.85) 0%, rgba(6, 182, 212, 0.95) 100%) !important;
        border: 1px solid rgba(103, 232, 249, 0.5) !important;
        box-shadow: 0 0 15px rgba(6, 182, 212, 0.35) !important;
        color: #FFFFFF !important;
        border-radius: 12px !important;
        font-weight: 600 !important;
        transition: all 0.2s ease !important;
    }
    .stButton > button:hover {
        box-shadow: 0 0 25px rgba(34, 211, 238, 0.6) !important;
        transform: translateY(-1px) !important;
    }

    /* Custom Glass Inputs */
    .stTextInput input, .stSelectbox select, .stSlider {
        background-color: rgba(6, 13, 27, 0.7) !important;
        border: 1px solid rgba(34, 211, 238, 0.25) !important;
        color: #F1F5F9 !important;
        border-radius: 10px !important;
    }
    </style>
    """, unsafe_allow_html=True)
```

---

## 3. Interactive Liquid Glass Breathing Exercise for Streamlit

Use Streamlit Components to render the animated Liquid Glass breathing orb in `ui/platform_features.py`:

```python
import streamlit as st
import streamlit.components.v1 as components

def render_liquid_glass_breathing(current_user=None):
    st.subheader("Guided Breathing Sanctuary")
    st.write("Slow, rhythmic parasympathetic nerve regulation.")

    orb_html = """
    <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding: 30px; font-family: sans-serif; background: transparent;">
      <style>
        @keyframes breathAnimation {
          0%, 100% {
            transform: scale(0.8);
            box-shadow: 0 0 35px rgba(6, 182, 212, 0.35);
          }
          50% {
            transform: scale(1.2);
            box-shadow: 0 0 75px rgba(34, 211, 238, 0.75), 0 0 120px rgba(6, 182, 212, 0.4);
          }
        }
        .breathing-orb {
          width: 200px;
          height: 200px;
          border-radius: 50%;
          background: radial-gradient(circle at 35% 30%, rgba(103, 232, 249, 0.3) 0%, rgba(6, 182, 212, 0.15) 50%, rgba(10, 24, 46, 0.9) 90%);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(103, 232, 249, 0.5);
          animation: breathAnimation 8s ease-in-out infinite;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 700;
          text-align: center;
          font-size: 14px;
          letter-spacing: 1px;
        }
      </style>
      <div class="breathing-orb">
        <span>BREATHE IN<br><small style="font-weight:400; opacity:0.8;">and release</small></span>
      </div>
      <p style="color: #94A3B8; font-size: 12px; margin-top: 25px;">Follow the glowing cyan glass orb: Inhale as it expands, exhale as it settles.</p>
    </div>
    """
    components.html(orb_html, height=320)

    # Login protection notice
    if not current_user:
      st.info("🔒 Sign in to save your breathing sessions to your personal wellness timeline.")
```

---

## 4. Login Protection Guard for Streamlit History (`ui/platform_features.py`)

Enforce profile authentication before writing or displaying personal records:

```python
def render_history_tab(current_user, store):
    st.subheader("My Wellbeing History")
    
    # 🔒 Login Protection Guard
    if not current_user:
        st.warning("🔒 **Private Wellness Records Protected**")
        st.write("Please sign in or create an account in the **Account & Settings** tab to access your confidential stress timeline, trend graphs, and session reflections.")
        return

    # User is authenticated
    st.success(f"Signed in as {current_user['display_name']} ({current_user['email']})")
    
    # Render historical trend charts and assessment records
    assessments = store.list_assessments(current_user["id"])
    if not assessments:
        st.info("No assessments logged yet. Run an assessment and click 'Save Assessment'.")
    else:
        st.write(f"Displaying {len(assessments)} saved records.")
        # Render charts...
```

---

## 5. Preserved Mathematical Engine Compatibility
The React web application preserves the exact Python algorithms:
- `fuzzy_engine/membership.py` ↔ `src/engine/membership.ts` (trapmf, trimf)
- `fuzzy_engine/rules.py` ↔ `src/engine/rules.ts` (31 rules)
- `fuzzy_engine/inference.py` ↔ `src/engine/inference.ts` (centroid defuzzification)
- `recommendation/recommendation_engine.py` ↔ `src/recommendation/recommendationEngine.ts`

If you would like automated file patches applied directly to your repository, please upload your project ZIP file at any time.
