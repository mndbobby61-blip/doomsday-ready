export function getRewatchOrder(targetId, graph) {
  const order = [];
  const done = new Set();
  const inProgress = new Set();

  const visit = (id) => {
    if (done.has(id)) return;
    if (inProgress.has(id)) {
      throw new Error('Cycle detected in prerequisite graph');
    }
    inProgress.add(id);
    for (const prerequisiteId of graph.get(id) ?? []) visit(prerequisiteId);
    inProgress.delete(id);
    done.add(id);
    order.push(id);
  };

  visit(targetId);
  order.pop();
  return order;
}

export function wouldCreateCycle(movieId, newPrerequisiteIds, graph) {
  const seen = new Set();
  const stack = [...newPrerequisiteIds];

  while (stack.length > 0) {
    const current = stack.pop();
    if (current === movieId) return true;
    if (seen.has(current)) continue;
    seen.add(current);
    for (const prerequisiteId of graph.get(current) ?? []) stack.push(prerequisiteId);
  }
  return false;
}