export interface ExportProgressEvent {
  stage:        'preparing' | 'capturing' | 'encoding' | 'done' | 'error'
  percent:      number
  message:      string
  url?:         string
  currentSlide?: number
  totalSlides?:  number
}
