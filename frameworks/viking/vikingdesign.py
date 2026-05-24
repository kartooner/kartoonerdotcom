import sys
import os

def help():
    print("""
Viking Design Framework CLI
---------------------------
Usage: /vikingdesign <command> [target]

Commands:
  gate      2. Apply the 5 Gates (Mimir).
  map       4. Perform system mapping (Heimdall).
  shape     5. Plan UI recipes (Loki).
  chain     1-7. Activate full Creative Skill Chain (Odin -> Thor).
  craft     7. Technical handoff specs (Thor).
  audit     1. Aesthetic & AI Slop audit (Odin).
  polish    1. Final refinement pass (Odin).
    """)

def main():
    if len(sys.argv) < 2:
        help()
        return

    cmd = sys.argv[1].lower()
    
    if cmd == "gate":
        print("Invoking 2. Mimir (UX Researcher)... [Reference: reference/gate.md]")
    elif cmd == "map":
        print("Invoking 4. Heimdall (Systems Architect)... [Reference: reference/map.md]")
    elif cmd == "shape":
        print("Invoking 5. Loki (Flow Designer)... [Reference: reference/map.md]")
    elif cmd == "audit":
        print("🛡️  Activating Eye of Mimir (Deterministic Slop Detection)...")
        os.system("node scripts/viking-detect.mjs .")
        print("\nInvoking 1. Odin (Creative Director) for LLM Critique...")
    elif cmd == "document":
        print("🛡️  Activating Viking Documenter...")
        os.system("node scripts/viking-document.mjs .")
    elif cmd == "chain":
        print("Activating full Viking Creative Skill Chain (1. Odin -> 2. Mimir -> 3. Tyr -> 4. Heimdall -> 5. Loki -> 6. Bragi -> 7. Thor)...")
    elif cmd == "craft":
        print("Invoking 7. Thor (Handoff Specialist)... [Reference: agents/viking-handoff-specialist.md]")
    else:
        print(f"Unknown Viking command: {cmd}")
        help()

if __name__ == "__main__":
    main()
