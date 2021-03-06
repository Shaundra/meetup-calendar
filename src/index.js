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

const seedCalEventSources = [
  'https://www.meetup.com/shescoding-seattle/events/ical/',
  'https://www.meetup.com/PSPPython/events/ical/',
  'https://www.meetup.com/Seattle-PyLadies/events/ical/',
  'https://www.meetup.com/openseattle/events/ical/',
  'https://www.meetup.com/seattle-api/events/ical/',
  'https://www.meetup.com/seattlestupidhackathon/events/ical/'
]

const localEventSources = pushCalEventSourcesToLocalStorage(seedCalEventSources)
fetchCalendarEventSources(localEventSources)

renderViewCalSource(calElmt)

function renderCalEventDetailsToDOM(info) {
  const details = {
    'title': 'title', 'start': 'start', 'end': 'end', 'description': 'description', 'location': 'location', 'url': 'url'
  }

  const evtDetailUl = document.getElementById('dialog-attr-ul')

  const evtDetailItms = Array.from(document.querySelector('#dialog-content-div ul').children)
  evtDetailItms.forEach(itm => itm.remove())

  for (let attr in details) {
    let attrElmt = document.createElement('li')
    attrElmt.className = 'event-detail-attrs'
    attrElmt.setAttribute('name', `event-detail-${attr}`)

    switch(attr) {
      case 'title':
      case 'start':
      case 'end':
        attrElmt.innerText = info.event[attr]
        break
      case 'description':
      case 'location':
      // case 'url':
        attrElmt.innerText = info.event.extendedProps[attr]
        break
      case 'url':
        const eventURL = document.createElement('a')
        const linkAttrs = [['rel', 'noreferrer noopener'], ['href', info.event.extendedProps[attr]], ['target', '_blank']]
        linkAttrs.forEach(attr => eventURL.setAttribute(attr[0], attr[1]))
        eventURL.innerText = info.event.extendedProps[attr]
        attrElmt.append(eventURL)
        break
    }

    const attrName = document.createElement('span')
    attrName.innerText = `Event ${attr}: `
    attrElmt.prepend(attrName)

    evtDetailUl.append(attrElmt)
  }
}

function parseCalEventsFromSource(calendarText, calendarURL) {
  let events = []
  const parsedCal = ICAL.parse(calendarText)
  const calName = parsedCal[1][5][3]
  // console.log('ive parsed the file', parsedCal)

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

  const newEventSource = {id: calName, srcURL: calendarURL, events}
  calendar.addEventSource(newEventSource)
}

function fetchCalendarEventSources(eventSources) {
  const corsAnywhere = 'https://cors-anywhere.herokuapp.com/'

  return Promise.all(
    eventSources.map(eventSource => {
      return (
        fetch(corsAnywhere + eventSource)
        .then(resp => resp.text())
        .then(calText => parseCalEventsFromSource(calText, eventSource))
      )
    })
  )
}

function pushCalEventSourcesToLocalStorage(calEventSources) {
  // if there are sources in localstorage, use those. else use seeds
  if (!localStorage.getItem('calendarSources')) {
    localStorage.setItem('calendarSources', JSON.stringify(calEventSources))
  }

  return JSON.parse(localStorage.getItem('calendarSources'))
}

function renderViewCalSource(calendarDiv) {
  const newBtn = document.createElement('button')
  newBtn.innerText = 'Calendar Sources'
  newBtn.className = 'event-sources-btn'
  newBtn.setAttribute('data-a11y-dialog-show', 'event-detail-dialog')

  newBtn.addEventListener('click', () => renderEventSourcesToDialog())

  calendarDiv.prepend(newBtn)
}

function renderEventSourcesToDialog() {
  const dialogUl = document.getElementById('dialog-attr-ul')
  const dialogItms = Array.from(document.querySelector('#dialog-content-div ul').children)
  dialogItms.forEach(itm => itm.remove())

  const addBtn = document.createElement('button')
  addBtn.innerText = 'Add Calendar Source'
  addBtn.className = 'add-source-btn'
  addBtn.addEventListener('click', () => addCalEventSource(dialogUl, addBtn))
  dialogUl.append(addBtn)

  const calEventSources = calendar.getEventSources()
  console.log("event sources-", calEventSources)

  calEventSources.forEach(src => {
    let srcLi = document.createElement('li')
    srcLi.className = 'cal-sources-list'
    srcLi.innerText = src.id

    const deleteBtn = document.createElement('button')
    deleteBtn.innerText = 'Delete'
    deleteBtn.className = 'delete-source-btn'
    deleteBtn.addEventListener('click', () => {
      console.log('removing an event source', src.id)
      src.remove()
      removeSourceFromStorage(src.internalEventSource._raw.srcURL)
    })
    srcLi.append(deleteBtn)

    dialogUl.append(srcLi)
  })
}

function removeSourceFromStorage(src) {
  const currStorage = JSON.parse(localStorage.getItem('calendarSources'))
  const newStorage = JSON.stringify(currStorage.filter(url => url !== src))

  localStorage.setItem('calendarSources', newStorage)
}

function addCalEventSource(dialogUL, showDialogBtn) {
  // on click of button, add input field, hide initial button
  // on submit, create eventSource, add url to localstorage, show initial button
  const newSrcForm = document.createElement('form')
  newSrcForm.addEventListener('submit', (ev) => {
    ev.preventDefault()
    // TO-DO: add validation that user input is valid ical url
    const newSrc = [ev.target.newSrcInput.value]

    fetchCalendarEventSources(newSrc)
    // TO-DO: only update localStorage on successful fetchCalendarEventSources
    const currentLocalStorage = JSON.parse(localStorage.getItem('calendarSources'))
    const updatedLocalStorage = JSON.stringify(currentLocalStorage.concat(newSrc))
    localStorage.setItem('calendarSources', updatedLocalStorage)
  })

  const inputBox = document.createElement('input')
  const inputAttrs = [['type', 'text'], ['name', 'newSrcInput'], ['placeholder', 'https://www.meetup.com/shescoding-seattle/events/ical/']]
  inputAttrs.forEach(attr => inputBox.setAttribute(attr[0], attr[1]))

  // inputBox.setAttribute('type', 'text')
  const submitBtn = document.createElement('button')
  submitBtn.setAttribute('type', 'submit')
  submitBtn.innerText = 'Save to Calendar'
  newSrcForm.append(inputBox, submitBtn)

  dialogUL.prepend(newSrcForm)
  showDialogBtn.remove()
}
