// ! never make circular dependencies
const data = {
  1: { name: 'Project1', id: 1, type: 'software' },
  2: { name: 'Project2', id: 2, type: 'hardware' },
  3: { name: 'Project3', id: 3, type: 'software' },
}
const dataStats = {
  1: { workDone: '10%', id: 1, type: 'software' },
  2: { workDone: '30%', id: 2, type: 'hardware' },
  3: { workDone: '100%', id: 3, type: 'software' },
}

export function getProjects(req, res) {
  // * http handler
  // * route handler
  const query = req.query
  const filteredData =
    query.type === undefined
      ? data
      : Object.fromEntries(
          Object.entries(data).filter(([k, v]) => v.type === query.type),
        )
  res.json(filteredData)
}

export function createProject(req, res) {
  const response = req.body
  if (response != undefined && Object.keys(response).length !== 0) {
    res.json({ msg: 'Received new project' })
  } else {
    res.status(400).json({ error: 'New project cannot be received' })
  }
}

export function getProjectStats(req, res) {
  res.json(dataStats)
}

export function getProjectById(req, res) {
  const id = req.params.id
  if (Object.hasOwn(data, id)) res.json(data[id])
  else res.status(404).json({ error: 'Id does not exists' }) // http status code and msg
}
