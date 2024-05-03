import ffmMT from 'ffmetadata';

import { Video, Audio } from '../dist/index';

const link = 'https://www.youtube.com/watch?v=_qfnSJeSFLs';

async function test(url:string) {
  const data = await Audio({
    url,
    onDownloading: (d) => console.log(`Downloaded ${d.percentage}%`),
    directory: './',
  });
  console.log(data.pathfile);
  ffmMT.read(data.pathfile, (err, res) => {
    if (err) console.error('Error reading metadata', err);
    else console.log(res);
  });

  console.log(data.message);
}

test(link);