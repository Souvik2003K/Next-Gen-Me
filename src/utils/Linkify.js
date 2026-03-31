/**
 * linkify(text, color)
 * Splits a string on URLs and returns an array of
 * plain-string and <a> element nodes for React rendering.
 */

const URL_REGEX = /(https?:\/\/[^\s]+)/g;

export function Linkify(text, color = 'inherit') {
  const parts = text.split(URL_REGEX);

  return parts.map((part, i) => {
    if (URL_REGEX.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            color: color,
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            opacity: 0.85,
            cursor: 'pointer',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </a>
      );
    }
    return part;
  });
}