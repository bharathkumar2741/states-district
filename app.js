const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())
const dbpath = path.join(__dirname, 'covid19India.db')

let db = null
const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error:${e.message}`)
    process.exit(1)
  }
}
intializeDBAndServer()
module.exports = app

const convertStateDbObjectToResponsiveObject = dbobject => {
  return {
    stateId: dbobject.state_id,
    stateName: dbobject.state_name,
    population: dbobject.population,
  }
}
const convertdisDbObjectToResponsiveObject = dbobject => {
  return {
    districtId: dbobject.district_id,
    districtName: dbobject.district_name,
    stateId: dbobject.state_id,
    cases: dbobject.cases,
    cured: dbobject.cured,
    active: dbobject.active,
    deaths: dbobject.deaths,
  }
}

app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state
    `
  const statesArray = await db.all(getStatesQuery)
  response.send(statesArray.map(i => convertStateDbObjectToResponsiveObject(i)))
})

app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStatesQuery = `
    SELECT * FROM state WHERE state_id=${stateId};
    `
  const state = await db.get(getStatesQuery)
  response.send(convertStateDbObjectToResponsiveObject(state))
})

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postDistrictQuery = `
  INSERT INTO
    district (district_name, state_id , cases,cured,active,deaths)
    VALUES 
    ('${districtName}',${stateId},${cases},${cured},${active},${deaths});`
  await db.run(postDistrictQuery)
  response.send('District Successfully Added')
})

app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getdistrictQuery = `
    SELECT * FROM district WHERE district_id=${districtId};
    `
  const dis = await db.get(getdistrictQuery)
  response.send(convertdisDbObjectToResponsiveObject(dis))
})

app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatisticQuery = `
    SELECT 
      SUM(cases),
      SUM(cured),
      SUM(active),
      SUM(deaths)
    FROM 
      district
    WHERE 
      state_id = ${stateId};`
  const stats = await db.get(getStatisticQuery)
  response.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})



app.delete("/districts/:districtId/",async (request,response)=>{
  const {districtId} = request.params;
  const deleteQuery=`
  DELETE FROM district WHERE district_id=${districtId};`;
  await db.run(deleteQuery);
  response.send('District Removed');
});

app.put("/districts/:districtId/",async (request,response)=>{
  const {districtName,stateId,cases,cured,active,deaths}=request.body;
  const {districtId}=request.params;
  const updateQuery=`
  update district SET 
  district_name="${districtName}",
  state_id=${stateId},
  cases=${cases},
  cured= ${cured},
  active= ${active},
  deaths= ${deaths}
  `;
  await db.run(updateQuery);
  response.send("District Details Updated");
});
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `
  const getDistrictIdQueryResponse = await database.get(getDistrictIdQuery)
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `
  const getStateNameQueryResponse = await database.get(getStateNameQuery)
  response.send({stateName:getStateNameQueryResponse})
})