export function parseSrt(srtText) {
  const subtitles = []
  const blocks = srtText.split(/\n\n+/)
  
  let idCounter = 1
  
  for (const block of blocks) {
    const lines = block.trim().split('\n')
    
    if (lines.length < 2) continue
    
    let id = idCounter
    let timeLineIndex = 0
    let startTime = 0
    let endTime = 0
    let textLines = []
    
    const firstLine = lines[0].trim()
    if (/^\d+$/.test(firstLine)) {
      id = parseInt(firstLine, 10)
      timeLineIndex = 1
    } else {
      timeLineIndex = 0
    }
    
    if (timeLineIndex < lines.length) {
      const timeMatch = parseTimeLine(lines[timeLineIndex])
      if (timeMatch) {
        startTime = timeMatch.start
        endTime = timeMatch.end
        textLines = lines.slice(timeLineIndex + 1)
      } else {
        textLines = lines.slice(timeLineIndex)
      }
    }
    
    if (endTime <= startTime) {
      endTime = startTime + 3000
    }
    
    const text = textLines.join('\n').trim()
    
    subtitles.push({
      id,
      startTime,
      endTime,
      text: text || `字幕 ${id}`
    })
    
    idCounter++
  }
  
  return subtitles
}

function parseTimeLine(timeLine) {
  const timePatterns = [
    /(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2}):(\d{2})[,.](\d{1,3})/,
    /(\d{1,2}):(\d{2})[,.](\d{1,3})\s*-->\s*(\d{1,2}):(\d{2})[,.](\d{1,3})/
  ]
  
  for (const pattern of timePatterns) {
    const match = timeLine.match(pattern)
    if (match) {
      let start, end
      
      if (match.length === 9) {
        start = timeToMilliseconds(
          parseInt(match[1], 10),
          parseInt(match[2], 10),
          parseInt(match[3], 10),
          parseMilliseconds(match[4])
        )
        end = timeToMilliseconds(
          parseInt(match[5], 10),
          parseInt(match[6], 10),
          parseInt(match[7], 10),
          parseMilliseconds(match[8])
        )
      } else {
        start = timeToMilliseconds(
          0,
          parseInt(match[1], 10),
          parseInt(match[2], 10),
          parseMilliseconds(match[3])
        )
        end = timeToMilliseconds(
          0,
          parseInt(match[4], 10),
          parseInt(match[5], 10),
          parseMilliseconds(match[6])
        )
      }
      
      return { start, end }
    }
  }
  
  return null
}

function parseMilliseconds(msStr) {
  const padded = msStr.padEnd(3, '0')
  return parseInt(padded.substring(0, 3), 10)
}

export function timeToMilliseconds(hours, minutes, seconds, milliseconds = 0) {
  return (hours * 3600000) + (minutes * 60000) + (seconds * 1000) + milliseconds
}

export function millisecondsToTime(milliseconds) {
  const hours = Math.floor(milliseconds / 3600000)
  const minutes = Math.floor((milliseconds % 3600000) / 60000)
  const seconds = Math.floor((milliseconds % 60000) / 1000)
  const ms = milliseconds % 1000
  
  return `${padZero(hours, 2)}:${padZero(minutes, 2)}:${padZero(seconds, 2)},${padZero(ms, 3)}`
}

function padZero(num, length) {
  return num.toString().padStart(length, '0')
}

export function serializeSrt(subtitles) {
  if (!subtitles || subtitles.length === 0) {
    return ''
  }
  
  const sortedSubtitles = [...subtitles].sort((a, b) => a.startTime - b.startTime)
  
  let srt = ''
  
  for (let i = 0; i < sortedSubtitles.length; i++) {
    const sub = sortedSubtitles[i]
    
    srt += `${i + 1}\n`
    srt += `${millisecondsToTime(sub.startTime)} --> ${millisecondsToTime(sub.endTime)}\n`
    srt += `${sub.text}\n\n`
  }
  
  return srt.trim()
}