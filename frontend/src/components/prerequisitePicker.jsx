/** কোন মুভি আগে দেখতে হবে, তা বাছাই করার চিপ বাটন। */
export default function PrerequisitePicker({ movies, selected, onChange, excludeId }) {
  const options = movies.filter((movie) => movie.id !== excludeId);
  if (options.length === 0) return <p className="muted">No other movies yet.</p>;

  const toggle = (id) =>
    onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id]);

  return (
    <div className="chips" role="group" aria-label="Prerequisites">
      {options.map((movie) => (
        <button
          type="button"
          key={movie.id}
          className="chip"
          aria-pressed={selected.includes(movie.id)}
          onClick={() => toggle(movie.id)}
        >
          {movie.title}
        </button>
      ))}
    </div>
  );
}