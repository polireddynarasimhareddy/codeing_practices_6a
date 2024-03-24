const express = require('express')
const path = require('path')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const app = express()
let DataBase = null
const dbpath = path.join(__dirname, 'covid19India.db')
app.use(express.json())
module.exports = app

const initilizeDBAndServer = async () => {
  try {
    DataBase = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB error : ${e.message}`)
    process.exit(1)
  }
}

initilizeDBAndServer()

const convertObjectAPI_1 = objectItem => {
  return {
    stateId: objectItem.state_id,
    stateName: objectItem.state_name,
    population: objectItem.population,
  }
}
//API GET 1
app.get('/states/', async (request, response) => {
  const covidGetQuery = `select * from state;`
  const listQueryGetResponse = await DataBase.all(covidGetQuery)

  response.send(
    listQueryGetResponse.map(eachItem => convertObjectAPI_1(eachItem)),
  )
})

// API 2
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const covidGetQuery = `select * from state where state_id = ${stateId} ;`
  const listQueryGetResponse_2 = await DataBase.get(covidGetQuery)
  response.send(convertObjectAPI_1(listQueryGetResponse_2))
})

///API 3

app.post('/districts/', async (request, response) => {
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const postQueryCovid = `insert into
  district (district_name,state_id,cases,cured,active,deaths)
  values("${districtName}",${stateId},${cases},${cured},${active},${deaths}) ;`
  const listQueryPostResponse = await DataBase.run(postQueryCovid)
  response.send('District Successfully Added')
})

// API 4

const convertDbObjectAPI4 = (objectItem) => {
  return {
    districtId: objectItem.district_id,
    districtName: objectItem.district_name,
    stateId: objectItem.state_id,
    cases: objectItem.cases,
    cured: objectItem.cured,
    active: objectItem.active,
    deaths: objectItem.deaths,
  };
};
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const covidGetQuerydistrict = `select * from district where district_id = ${districtId} ;`
  const listQueryGetResponsedistrict = await DataBase.get(covidGetQuerydistrict)
 
 response.send(convertDbObjectAPI4(listQueryGetResponsedistrict));
  // listQueryGetResponse.map(eachItem => convertObjectAPI_2(eachItem)),
  // )
})

//API 5
app.delete('/districts/:districtId/', async (request, repsonse) => {
  const {districtId} = request.params
  const covidDeletedistrict = `delete from district where district_id = ${districtId} ;`
  await DataBase.run(covidDeletedistrict)
  repsonse.send('District Removed')
})

//API 6

app.put('/districts/:districtId/', async (request, repsonse) => {
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = request.body
  const covidPutistrictQuery = `update district set district_name = "${districtName}",
  state_id = ${stateId},
  cases = ${cases},
  cured = ${cured},
  active = ${active},
  deaths = ${deaths}
  where district_id = ${districtId} ;
   `
  await DataBase.run(covidPutistrictQuery)
  repsonse.send('District Details Updated')
})

//API 7
app.get('/states/:stateId/stats/', async (request, repsonse) => {
  const {stateId} = request.params
  const getStateStatsQuery = `
  select SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)
  from district 
  where state_id = ${stateId};`
  const stats = await DataBase.get(getStateStatsQuery)
  console.log(stats)

  repsonse.send({
    totalCases: stats['SUM(cases)'],
    totalCured: stats['SUM(cured)'],
    totalActive: stats['SUM(active)'],
    totalDeaths: stats['SUM(deaths)'],
  })
})

//API 8
app.get('/districts/:districtId/details/', async (request, repsonse) => {
  const {districtId} = request.params
  const getDistrictquery = `
  select state_id from district where district_id = ${districtId};`
  const getDistrictqueryResponse = await DataBase.get(getDistrictquery)

  const stateNameQuery = `
  select state_name as stateName from state where state_id = ${getDistrictqueryResponse.state_id};`
  const stateNameQueryResponse = await DataBase.get(stateNameQuery)
  repsonse.send(stateNameQueryResponse)
})
