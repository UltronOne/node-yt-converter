const ytdl = require("ytdl-core");
const ffmpeg = require("ffmpeg-static");
const ffmMT = require("ffmetadata");
const path = require("path");
const cp = require("child_process")
const getInfo = require("./getInfo")
const parserTitles = require("./parserTitles")

ffmMT.setFfmpegPath(ffmpeg);

/**
 * Executed when the process ends
 * @name onClose
 * @function
 */

/**
 * @param {string} url 
 * @param {number} itag 
 * @param {string} directoryDownload 
 * @param {onClose} onClose 
 */
const convertVideo = async (url, itag, directoryDownload, onClose) => {
    try {
        const info = await getInfo(url)
        const tracker = {
            audio: {
                total: null,
                downloaded: null
            },
            video: {
                total: null,
                downloaded: null
            }
        }
        const format = info.formats.find((fm) => fm.itag === itag)
        const title = parserTitles(info.title)
        const audio = ytdl(url, {
            filter: "audioonly"
        }).on("progress", (_, downloaded, total) => {
            tracker.audio = { downloaded, total }
        })
        const video = ytdl(url, {
            filter: "videoonly",
            quality: format.itag
        }).on("progress", (_, downloaded, total) => {
            tracker.video = { downloaded, total }
        })
    
        const pathname = path.resolve(process.cwd(), directoryDownload, `${title}.mp4`)
    
        const ffmpegProcess = cp.spawn(ffmpeg, [
            "-loglevel", "8", "-hide_banner",
            "-progress", "pipe:3",
            "-i", "pipe:4",
            "-i", "pipe:5",
            "-map", "0:a",
            "-map", "1:v",
            "-c:v", "copy",
            `${pathname}`,
        ], {
            windowsHide: true,
            stdio: [
                /* Standard: stdin, stdout, stderr */
                "inherit", "inherit", "inherit",
                /* Custom: pipe:3, pipe:4, pipe:5 */
                "pipe", "pipe", "pipe"
            ],
        });

        ffmpegProcess.stdio[3].on("data", () => {
            const videoTotal = (tracker.video.downloaded / tracker.video.total) * 100
            const audioTotal = (tracker.audio.downloaded / tracker.audio.total) * 100
            console.log(videoTotal, audioTotal)
            const percentage = Math.round((videoTotal + audioTotal) / 2)
            console.log(`Downloading: ${percentage}% for ${title}`)
        })
    
        ffmpegProcess.on("close", () => {
            onClose()
        })
    
        audio.pipe(ffmpegProcess.stdio[4])
        video.pipe(ffmpegProcess.stdio[5])
    } catch (err) {
        console.error(err)
    }
}

module.exports = convertVideo;