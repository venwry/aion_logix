// Audit decisions are append-only. Copy the array for staging, but share its
// immutable existing entries instead of deep-copying the entire growing archive
// for every approval, feedback step and mixed-review transaction.
export function stageFiles(original) {
 const path='data_storytelling/authorization_decision.json';
 const {[path]:history,...mutable}=original;
 const files=structuredClone(mutable);
 if(history)files[path]={...history,authorization_decision:[...history.authorization_decision]};
 return files;
}
