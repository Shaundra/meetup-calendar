import ICAL from 'ical.js';
import { Calendar } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import './app.css';
import '@fullcalendar/core/main.css';
import '@fullcalendar/daygrid/main.css';
import '@fullcalendar/timegrid/main.css';
import A11yDialog from 'a11y-dialog';

const calElmt = document.getElementById('calendar')
const eventDetailElmt = document.getElementById('event-detail-dialog')

const dialog = new A11yDialog(eventDetailElmt, calElmt);
// window.dia = dialog

const calendar = new Calendar(calElmt, {
  plugins: [ dayGridPlugin, timeGridPlugin ],
  defaultView: 'dayGridMonth', //'timeGridWeek',
  header: {
    left:   'title',
    center: 'timeGridWeek, dayGridMonth',
    right:  'today, prev, next'
  },
  eventLimit: 4,
  views: {
    timeGrid: {scrollTime: '12:00', slotEventOverlap: true}
  },
  eventRender: function(info) {
    const newBtn = document.createElement('button')
    newBtn.className = 'event-details-btn'
    newBtn.setAttribute('data-a11y-dialog-show', 'event-detail-dialog')
    newBtn.innerText='Details'
    info.el.append(newBtn)
  },
  eventPositioned: function(info) {
    dialog.destroy()
    dialog.create()
  },
  eventClick: function(info) { // function for onClick
    info.jsEvent.preventDefault()
    renderCalEventDetailsToDOM(info)
  }
});
calendar.render()

// window.cal = calendar

const calEventSources = [
  'https://www.meetup.com/shescoding-seattle/events/ical/',
  'https://www.meetup.com/PSPPython/events/ical/',
  'https://www.meetup.com/Seattle-PyLadies/events/ical/',
  'https://www.meetup.com/openseattle/events/ical/',
  'https://www.meetup.com/seattle-api/events/ical/',
  'https://www.meetup.com/seattlestupidhackathon/events/ical/'
]

fetchCalendarEventSources(calEventSources)
  // .then(() => {
  //   const evtDetailDiv = document.getElementById('event-detail-dialog')
  //   const evtDetailDialog = new A11yDialog(evtDetailDiv, calElmt)
  // })

function renderCalEventDetailsToDOM(info) {
  const details = {
    'title': 'title', 'start': 'start', 'end': 'end', 'description': 'description', 'location': 'location', 'url': 'url'
  }

  const evtDetailContent = document.getElementById('dialog-content-div')
  const evtDetailUl = document.getElementById('dialog-attr-ul')

  const evtDetailItms = Array.from(document.querySelector('#dialog-content-div ul').children)
  evtDetailItms.forEach(itm => itm.remove())

  for (let attr in details) {
    let attrElmt = document.createElement('li')
    attrElmt.className = 'event-detail-attrs'

    switch(attr) {
      case 'title':
      case 'start':
      case 'end':
        attrElmt.innerText = info.event[attr]
        break
      case 'description':
      case 'location':
      case 'url':
        attrElmt.innerText = info.event.extendedProps[attr]
        break
    }
    evtDetailUl.append(attrElmt)
  }

  evtDetailContent.append(evtDetailUl)
}

function renderEventDetailsToDialog(info) {

}

function fetchCalendarEventSources(eventSources) {
  const corsAnywhere = 'https://cors-anywhere.herokuapp.com/'

  return Promise.all(
    eventSources.map(eventSource => {
      return (
        fetch(corsAnywhere + eventSource)
        .then(resp => resp.text())
        .then(calText => {
          let events = []
          let parsedCal = ICAL.parse(calText)
          const calName = parsedCal[1][5][3]
          console.log('ive parsed the file', parsedCal)

          parsedCal[2].forEach(event => {
            if (event[0] === 'vevent') {
              let consolidatedEvent = {extendedProps: {}}

              const attrMap = {
                dtstart: 'start',
                dtend: 'end',
                summary: 'title'
              }

              event[1].forEach(eventAttr => {
                if (attrMap[eventAttr[0]]) {
                  consolidatedEvent[attrMap[eventAttr[0]]] = eventAttr[3]
                } else {
                  consolidatedEvent['extendedProps'][eventAttr[0]] = eventAttr[3]
                }
              })
              events.push(consolidatedEvent)
            }
          })

          console.log('i\'ve added events', events)

          const newEventSource = {id: calName, events}
          calendar.addEventSource(newEventSource)
        })
      )
    })
  )
}
