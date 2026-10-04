import type { Library } from '../lib/config'

export function PropsTable({ library }: { library: Library }) {
  return (
    <div className="props-reference">
      <p className="muted">
        Every prop is available in the component API. Use the JSON editor for structured values;
        functions and element references belong in your application code.
      </p>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {library.fields.map((field) => (
              <tr key={field.name}>
                <td>
                  <code>{field.name}</code>
                </td>
                <td>
                  <code>{field.type}</code>
                </td>
                <td>{field.description || 'Optional component configuration.'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
