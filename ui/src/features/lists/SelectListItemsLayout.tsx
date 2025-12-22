export function SelectListItemsLayout() {
  return (
    <div className="inspector-shell">
      <div className="card full-width">
        <div className="card-head spaced">
          <div className="table-title">
            <span className="table-badge">0</span>
            <h2>Select List Items</h2>
          </div>
          <div className="table-actions">
            <button className="btn secondary">Reset</button>
            <button className="btn primary">Save</button>
          </div>
        </div>

        <div className="select-list-toolbar">
          <div className="select-list-picker">
            <label className="muted small">Select Lists</label>
            <div
              className="picker-row"
              style={{ width: "520px", maxWidth: "100%", display: "flex", gap: 8, marginBottom: 8 }}
            >
              <select className="table-input" style={{ width: 250 }}>
                <option>Select a list...</option>
              </select>
              <input className="table-input" placeholder="Filter lists" style={{ width: 250 }} />
            </div>
            
            <div className="picker-row" style={{ gap: 12 }}>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <label className="muted small">Select List Name</label>
                <input className="table-input" placeholder="Name" style={{ marginBottom: 6 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                <label className="muted small">Description</label>
                <textarea
                  className="table-input"
                  placeholder="Description"
                  rows={2}
                  style={{ resize: "vertical" }}
                />
              </div>
            </div>
            <div className="table-actions" style={{ marginTop: 6 }}>
              <button className="btn secondary">New Select List</button>
              <button className="btn primary">Save List</button>
            </div>
          </div>

          <div className="select-list-picker">
            <label className="muted small">Grouping</label>
            <div className="picker-row">
              <select className="table-input">
                <option>Group set...</option>
              </select>
              <select className="table-input">
                <option>Group...</option>
              </select>
            </div>
            <div className="muted small">Grouping helper text lives here.</div>
          </div>
        </div>

        <div className="table-pane">
          <table className="data-table compact">
            <thead>
              <tr>
                <th>*Value</th>
                <th>*Display Value</th>
                <th style={{ width: 90 }}>*Order</th>
                <th style={{ width: 90 }}>Active</th>
                <th>Tooltip</th>
                <th>Comments</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <input className="table-input" placeholder="Value" />
                </td>
                <td>
                  <input className="table-input" placeholder="Display value" />
                </td>
                <td>
                  <input
                    className="table-input center"
                    type="number"
                    placeholder="0"
                  />
                </td>
                <td className="center">
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    defaultChecked
                  />
                </td>
                <td>
                  <input className="table-input" placeholder="Tooltip" />
                </td>
                <td>
                  <input className="table-input" placeholder="Comments" />
                </td>
              </tr>
              <tr className="new-row">
                <td>
                  <input className="table-input" placeholder="Value" />
                </td>
                <td>
                  <input className="table-input" placeholder="Display value" />
                </td>
                <td>
                  <input
                    className="table-input center"
                    type="number"
                    placeholder="0"
                  />
                </td>
                <td className="center">
                  <input
                    type="checkbox"
                    className="table-checkbox"
                    defaultChecked
                  />
                </td>
                <td>
                  <input className="table-input" placeholder="Tooltip" />
                </td>
                <td>
                  <input className="table-input" placeholder="Comments" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="side-pane">
        <div className="side-pane-tabs">
          <button className="tab active" type="button">
            Groups
          </button>
          <button className="tab" type="button" disabled>
            Properties
          </button>
        </div>
        <div className="side-pane-content">
          <div className="muted small">
            Manage group sets and groups for this list.
          </div>
          <div className="pane-header-actions row">
            <button className="btn secondary" type="button">
              Add
            </button>
            <input
              className="table-input"
              placeholder="New group set name"
              style={{ flex: 1 }}
            />
          </div>
          <div className="muted small">No group sets yet.</div>
        </div>
      </div>
    </div>
  );
}
