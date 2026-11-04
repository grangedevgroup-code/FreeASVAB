# FreeASVAB

FreeASVAB is a free practice app and study guide for the ASVAB, the test you take to join the U.S. military. You can take as many practice tests as you like, see an estimated AFQT score after each one, and learn every subject from plain-English lessons. There are no accounts, ads or payments, and your results stay on your own device.

**Use it now:** https://grangedevgroup-code.github.io/FreeASVAB/

It runs in any modern browser on a phone, tablet or computer. To use it like an app, add it to your home screen: on Android or a computer, open the browser menu and choose Install app; on iPhone or iPad, tap Share and then Add to Home Screen. After the first visit it works offline.

## What you can do

The quick AFQT test covers Arithmetic Reasoning, Word Knowledge, Paragraph Comprehension and Mathematics Knowledge, the four subjects that decide whether you can enlist. The full practice test has all ten subjects in the same order and with the same time limits as the computer ASVAB. Both end with an estimated AFQT percentile and category, a check against each branch's minimum score, estimated subject scores, and Army and Air Force job scores.

Practice mode lets you pick one subject and shows the answer and an explanation after every question. It mixes in questions you have not seen yet with ones you missed before. Arithmetic Reasoning and Mathematics Knowledge also have generated problems, so you never run out of new math practice. The Learn tab has a lesson for every subject, and the Progress tab tracks your scores over time.

## About the scores

The real computer ASVAB adapts to your answers and converts them with official tables that are not public, so no practice app can give you an exact score. FreeASVAB corrects your percent correct for guessing, turns it into a standard score where 50 is average, and applies the published AFQT formula (2 × VE + AR + MK) to estimate a percentile from 1 to 99. Use it to see whether you are improving and where to focus. The About page in the app explains the method in more detail.

## Your data

Results are saved in your browser's local storage and never leave the device. Settings has a button to save a backup file and another to restore it, which is also how you move your progress to a new phone. On iPhone and iPad, Safari can erase data for websites you have not opened in seven days, so add the app to your Home Screen or keep a backup.

## The printable study guide

The `src` folder holds the full study guide in Markdown: 21 chapters, three practice tests and about 700 questions with explanations. `build.py` turns it into a PDF. The app reads the same files, so a fix to a question shows up in both places.

## Building it yourself

The app lives in `freeasvab-app` and needs Node.js 22 or newer.

```
cd freeasvab-app
npm install
npm run dev      # local server with live reload
npm test         # content checks and unit tests
npm run build    # static site in dist/
```

`npm run content` turns the guide in `src` into the JSON the app loads, and fails if a question has the wrong number of choices, no marked answer, no explanation, or a math answer that does not match its check formula. Questions use a short Markdown format. A question starts with `? `, each choice with `- `, the right choice ends with ` *`, and the explanation starts with `>`. The existing chapters have plenty of examples.

The same build can be wrapped as an Android or iOS app with Capacitor: run `npm run cap:sync`, then open the `android` or `ios` project in Android Studio or Xcode.

## License and disclaimer

MIT licensed; see `LICENSE`. Contributions of new questions and fixes are welcome.

FreeASVAB is not affiliated with or endorsed by the U.S. Department of Defense or any branch of the military. ASVAB is a registered trademark of the U.S. Department of Defense. Enlistment rules and minimum scores change, so confirm current requirements with a recruiter.
