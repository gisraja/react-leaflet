// @flow

import { forEach } from 'lodash'
import type { Evented } from 'leaflet'
import { Component } from 'react'

import type { MapComponentProps } from './types'

export const EVENTS_RE = /^on(.+)$/i

type EventHandler = (event: Event) => void
type EventsObject = { [key: string]: EventHandler }

export default class MapComponent<
  LeafletElement: Evented,
  Props: MapComponentProps,
> extends Component<Props> {
  _leafletEvents: EventsObject
  leafletElement: LeafletElement

  constructor(props: Props) {
    super(props)
    this._leafletEvents = this.extractLeafletEvents(props)
  }

  componentDidMount() {
    this.bindLeafletEvents(this._leafletEvents)
  }

  // eslint-disable-next-line no-unused-vars
  componentDidUpdate(prevProps: Props) {
    this._leafletEvents = this.bindLeafletEvents(
      this.extractLeafletEvents(this.props),
      this._leafletEvents,
    )
  }

  componentWillUnmount() {
    const el = this.leafletElement
    if (!el) return

    forEach(this._leafletEvents, (cb, ev) => {
      el.off(ev, cb)
    })
  }

  extractLeafletEvents(props: Props): EventsObject {
    return Object.keys(props).reduce((res, prop) => {
      if (EVENTS_RE.test(prop)) {
        if (props[prop] != null) {
          const key = prop.replace(EVENTS_RE, (match, p) => p.toLowerCase())
          res[key] = props[prop]
        }
      }
      return res
    }, {})
  }

  bindLeafletEvents(
    next: EventsObject = {},
    prev: EventsObject = {},
  ): EventsObject {
    const el = this.leafletElement
    if (el == null || el.on == null) return {}

    const diff = { ...prev }
    forEach(prev, (cb, ev) => {
      if (next[ev] == null || cb !== next[ev]) {
        delete diff[ev]
        el.off(ev, cb)
      }
    })

    forEach(next, (cb, ev) => {
      if (prev[ev] == null || cb !== prev[ev]) {
        diff[ev] = cb
        el.on(ev, cb)
      }
    })

    return diff
  }

  fireLeafletEvent(type: string, data: ?any) {
    const el = this.leafletElement
    if (el) el.fire(type, data)
  }

  getOptions(props: Props): Props {
    if (props.pane != null) {
      return props
    }
    if (props.leaflet != null && props.leaflet.pane != null) {
      return { ...props, pane: props.leaflet.pane }
    }
    return props
  }
}
