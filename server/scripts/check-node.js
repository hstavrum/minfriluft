"use strict";

/* ==========================================================================
   scripts/check-node.js – sjekker at Node er ny nok

   Vi krever Node 22 eller nyere. Det er ikke bare en advarsel:
   better-sqlite3 13 har ferdigbygde biblioteker for Node 22 og nyere.
   På Node 18 må biblioteket bygges fra kildekoden, og det trenger en
   C++-kompilator. Da ender installasjonen med "Could not locate the
   bindings file", som er vanskelig å forstå.

   Derfor stopper vi installasjonen med en klar beskjed i stedet.
   ========================================================================== */

const MAJOR = Number(process.versions.node.split(".")[0]);

/* Hvilken Node-versjon vi krever. Standard er 22, som er det
   better-sqlite3 13 er bygget for. Kan overstyres hvis man kjører på
   en eldre Node med en tilsvarende eldre better-sqlite3. */
const REQUIRED = Number(process.env.MINFRILUFT_REQUIRED_NODE || 22);

/* Nødtiltak: hvis noen må kjøre på en eldre Node, kan sjekken slås av
   med MINFRILUFT_SKIP_NODE_CHECK=1. Da må de også velge en
   better-sqlite3-versjon som passer. */
if (process.env.MINFRILUFT_SKIP_NODE_CHECK === "1") {
  process.exit(0);
}

if (MAJOR >= REQUIRED) {
  process.exit(0);
}

console.error("");
console.error("  Min friluft trenger Node " + REQUIRED + " eller nyere.");
console.error("  Denne maskinen har Node " + process.versions.node + ".");
console.error("");
console.error("  Oppdater Node, og prøv igjen:");
console.error("");
console.error("    # Ubuntu og Debian");
console.error("    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -");
console.error("    sudo apt-get install -y nodejs");
console.error("");
console.error("    # Fedora");
console.error("    sudo dnf module install -y nodejs:22");
console.error("");
console.error("    # Eller med nvm");
console.error("    nvm install 22 && nvm alias default 22");
console.error("");
console.error("  Sjekk versjonen med: node -v");
console.error("");
console.error("  Node 18 er ikke lenger vedlikeholdt, og bør ikke brukes");
console.error("  på en server som er koblet til internett.");
console.error("");

process.exit(1);
