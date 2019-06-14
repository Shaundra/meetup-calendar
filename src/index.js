import ICAL from 'ical.js';
// import { FullCalendar } from 'fullcalendar'
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import './app.css'
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';


let calElmt = document.createElement('div')
calElmt.id = 'calendar'
let body = document.getElementsByTagName('body')[0]
body.append(calElmt)

const eventTest = [
  {
    class: "PUBLIC",
    created: "2018-10-04T16:23:19Z",
    description: "Seattle PyLadies↵Monday, June 24 at 5:00 PM↵↵Bring your own project, get help with Code Academy, make friends! Remember to bring your laptop for Python, Flask, Django or database fun!↵↵https://www.meetup.com/Seattle-PyLadies/events/261880293/",
    dtstamp: "2019-06-14T22:08:41Z",
    end: "2019-06-24T19:00:00",
    start: "2019-06-24T17:00:00",
    status: "CONFIRMED",
    title: "Hacknight!",
    uid: "event_hztphqyzjbgc@meetup.com",
    url: "https://www.meetup.com/Seattle-PyLadies/events/261880293/",
  },
  {
    class: "PUBLIC",
    created: "2018-12-04T02:55:04Z",
    description: "Seattle PyLadies↵Thursday, June 27 at 6:00 PM↵↵EastSide HackNight is back!! with Learning Circles!💞💯🎉🚀 Join us! We started learning circles in the eastside at WeWork Lincoln Square! WeWork Lincoln ...↵↵https://www.meetup.com/Seattle-PyLadies/events/260971934/",
    dtstamp: "2019-06-14T22:08:41Z",
    end: "2019-06-27T20:00:00",
    location: "WeWork Lincoln Square (10400 NE 4th Street, Bellevue, WA, USA 98004)",
    start: "2019-06-27T18:00:00",
    status: "CONFIRMED",
    title: "EastSide HackNight / Learning Circles 💞💯🎉🚀",
    uid: "event_crmvmqyzjbjc@meetup.com",
    url: "https://www.meetup.com/Seattle-PyLadies/events/260971934/",
  }
]

let calendar = new Calendar(calElmt, {
  plugins: [ dayGridPlugin ],
  // events: eventTest
});
calendar.render()

const corsAnywhere = 'https://cors-anywhere.herokuapp.com/'
// const ex_cal = 'https://www.meetup.com/Seattle-PyLadies/events/ical/'
const ex_cal = 'https://www.meetup.com/Seattle-Mochalites/events/ical/71573322/891c1cd21aec84eeed7362ccad7b35b3cca4c99c/Seattle+Mochalites/'

let events = []

fetch(corsAnywhere + ex_cal)
  .then(resp => resp.text())
  .then(calText => {
    let parsedCal = ICAL.parse(calText)
    console.log('ive parsed the file', parsedCal)
    parsedCal[2].forEach(event => {
      if (event[0] === 'vevent') {
        let consolidatedEvent = {}
        const eventAttrMap = {
          dtstart: 'start',
          dtend: 'end',
          summary: 'title'
        }
        event[1].forEach(eventAttr => {
          if (eventAttrMap[eventAttr[0]]) {
            consolidatedEvent[eventAttrMap[eventAttr[0]]] = eventAttr[3]
          } else {
            consolidatedEvent[eventAttr[0]] = eventAttr[3]
          }
        })
        events.push(consolidatedEvent)
      }
    })
    console.log('i\'ve added events', events)
    console.log('test log')

    calendar.addEventSource(events)
  })
