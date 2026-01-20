> This file is a roadmap for the features that need to be designed and the progress within each feature.

## Data Entry
The various data entry workflows that allow the rules designer to input the necessary data into the system. A scripting query language will be used to query select lists.

### Select Lists
Data needed for display in a select input (ComboBox) will come from the data retrieved from a select list.

**Static fields (cannot be removed)**
- ✅ Value — The value that is selected behind the scenes (not what is displayed in the dropdown).
- ✅ Display Value — The text that will be displayed in the dropdown.
- ✅ Order — Used to order the selections within the dropdown.
- ✅ Active — Whether an item in the select list is active. By default, inactive items will not be returned when querying data.
- ✅ Tooltip — A tooltip that will be displayed when the user hovers the mouse over a select list item.
- ✅ Comments — Any comments or notes that may need to be captured for a select list item.

**User-defined properties**
Subsequent fields added by the rules writer to further define select list items.
- ✅ Name — Unique property name per select list.
- ✅ Data Type — The data type of the property (string, integer, boolean, etc.).

**Group Sets / Groups**
A group set is a logical container for a set of groups while a group will contain members selected from that select list.
- ✅ Group Set — The group set only requires a name.
- ✅ Group — A group only requires a group name and will be a child of a group set.
- ✅ Group Members — Selected from select list items and assigned to that group. Select list items can be members of one or more groups.

### Lookup Tables
Tables of data that can be queried for any purpose. Some uses include data retrieval, quote rules execution, conversion to select list, etc. A scripting query language will be developed to query lookup tables.
- [ ] Tables — Only a table name is required to create a new lookup table. Return datasets will be returned as a collection. When defining a query, the rules writer will select which column to use as key for the collection. Collection keys must be unique.

### Ranges
The rules writer will be able to define ranges for use in the rules execution.
- [ ] Range — Ranges will have a name, minimum, maximum, and step.

## Option Designer
The option designer will require the development of a forms designer. The forms designer will have:

**Toolbox**
- [ ] Labels — Used to display information.
- [ ] Inputs — Textboxes used to enter required data.
- [ ] Selects — Selects are used to provide the user with a dropdown list of selections.
- [ ] Checkboxes — Uses true/false options.

**Properties Editor**
Edit the various properties for components dropped on the form.

- [ ] Name — The name of the component.
- [ ] Color — Component color.
- [ ] Position — Position of the component.
- [ ] Size — The size of the component.

**Variable Editor**
Variables will be defined per option. When tying a variable to a component, only variables of similar type will be available, e.g. checkbox can only accept variables of type Boolean.

- [ ] Name - The name of the variable.
- [ ] Data Type - The data type of the variable (string, number, boolean, etc.).
- [ ] Default Value - the value (if any) of the variable before any operation is performed on it.
- [ ] Size — The size of the component.
- [ ] More to come as the scope becomes clearer.

## Quote Configuration Screen
Definition to follow
