import React, {useState, useEffect} from 'react';
import ReactMarkdown from "react-markdown";
import './App.css';
import translations from './translations';
import bibles from './bibles';

function App() {

    const getBibles = () => {
        const bibleCV = {};
        for (const row of bibles.split('\n')) {
            const cells = row.split('\t');
            bibleCV[cells[0]] = {
                nlt: cells[1],
                lsg: cells[2]
            }
        }
        return bibleCV;
    }

    const getRecords = () => {
        const rows = translations.split('\n');
        const newRows = [];
        const headers = rows[0].split('\t');
        for (const row of rows.slice(1)) {
            const rowRecord = {};
            let c = 0;
            for (const cell of row.split('\t')) {
                rowRecord[headers[c]] = cell.replace(/\\n/g, "\n");
                c++;
            }
            newRows.push(rowRecord);
        }
        return newRows;
    }

    const [records, setRecords] = useState(getRecords());
    const [bibleLookup, setBibleLookup] = useState(getBibles());
    const [pageSettings, setPageSettings] = useState({
        recordN: 0,
        translations: [],
        best: {
            sense: '',
            style: '',
            level: '',
        }
    });

    const rand = mx => Math.floor(Math.random() * mx)

    const newQuestion = () => {
        let newRecordN = pageSettings.recordN;
        while (newRecordN === pageSettings.recordN) {
            newRecordN = rand(records.length);
        }
        const newRecord = records[newRecordN];
        const translations = Object.keys(newRecord).filter(t => !["Source", "ID", "From", "To"].includes(t));
        let translationA = translations[rand(translations.length)];
        while (newRecord[translationA] === "Non traduit") {
            translationA= translations[rand(translations.length)];
        }
        let translationB = translationA;
        while (translationB === "Non traduit" || translationA === translationB || newRecord[translationA].replace(/\*/g,"").trim() === newRecord[translationB].replace(/\*/g,"").trim()) {
            translationB = translations[rand(translations.length)];
        }
        setPageSettings({
                recordN: newRecordN,
                translations: [translationA, translationB],
                best: {
                    sense: '',
                    style: '',
                    level: '',
                }
            }
        )
    }

    const submit = async () => {
        const responseRecord = {
            noteId: records[pageSettings.recordN].ID,
            translations: pageSettings.translations,
            best: pageSettings.best
        }
        const requestOptions = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(responseRecord)
        };
        await fetch('http://localhost:2468/submit', requestOptions);
        newQuestion();
    }

    const selectBest = (field, value) => {
        const newSettings = {
            recordN: pageSettings.recordN,
            translations: pageSettings.translations,
            best: {
                sense: field === "sense" ? value : pageSettings.best.sense,
                style: field === "style" ? value : pageSettings.best.style,
                level: field === "level" ? value : pageSettings.best.level,
            }
        };
        setPageSettings(newSettings);
    }

    useEffect(
        () => {
            newQuestion();
        },
        []
    )

    return (
        <div className="App">
            {
                pageSettings.translations.length > 0 && Object.keys(bibleLookup).length > 0 &&
                <>
                    <h1>
                        {`${records[pageSettings.recordN]["From"]} - ${records[pageSettings.recordN]["To"]}`}
                        {` ( ${records[pageSettings.recordN]["ID"]} )`}
                    </h1>
                    <table>
                        <tbody>
                        <tr>
                            <td style={{
                                textAlign: "right",
                                paddingRight: "20px",
                                fontSize: "x-large"
                            }}>
                                LSG
                            </td>
                            <td style={{paddingTop: "15px", paddingBottom: "15px"}}><i>{bibleLookup[records[pageSettings.recordN]["From"].split(' ')[1]].lsg}</i></td>
                        </tr>
                        <tr>
                            <td style={{
                                textAlign: "right",
                                paddingRight: "20px",
                                fontSize: "x-large"
                            }}>
                                NLT
                            </td>
                            <td style={{paddingTop: "15px", paddingBottom: "15px"}}><i>{bibleLookup[records[pageSettings.recordN]["From"].split(' ')[1]].nlt}</i></td>
                        </tr>
                        {
                            [
                                "Source",
                                pageSettings.translations[0],
                                pageSettings.translations[1],
                            ]
                                .map(
                                    (f, n) => <tr key={n}>
                                        <td style={{
                                            textAlign: "right",
                                            paddingRight: "20px",
                                            fontSize: "x-large"
                                        }}>
                                            {f === "Source" ? "Source" : (f === pageSettings.translations[0] ? "transA" : "transB")}
                                        </td>
                                        <td>
                                            <ReactMarkdown key={n} children={records[pageSettings.recordN][f]}/>
                                        </td>
                                    </tr>
                                )
                        }
                        </tbody>
                    </table>
                    <table>
                        <thead>
                        <tr>
                            <th style={{padding: "5px", textAlign: "left"}}>EVALUATION</th>
                        </tr>
                        </thead>
                        <tbody>
                        <tr>
                            <td style={{padding: "5px"}}>la traduction qui respecte au mieux le sens de la note anglaise
                                :
                            </td>
                            <td style={{padding: "5px"}}>
                                <select onChange={e => selectBest("sense", e.target.value)} value={pageSettings.best.sense}>
                                    <option value="">-</option>
                                    <option value={pageSettings.translations[0]}>A</option>
                                    <option value={pageSettings.translations[1]}>B</option>
                                    <option value="SAME">Pareil</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td style={{padding: "5px"}}>la traduction avec le style le plus naturel :</td>
                            <td style={{padding: "5px"}}>
                                <select onChange={e => selectBest("style", e.target.value)} value={pageSettings.best.style}>
                                    <option value="">-</option>
                                    <option value={pageSettings.translations[0]}>A</option>
                                    <option value={pageSettings.translations[1]}>B</option>
                                    <option value="SAME">Pareil</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td style={{padding: "5px"}}>la traduction qui utilise le registre et vocabulaire les plus
                                adaptés à un lecteur de niveau B1 :
                            </td>
                            <td style={{padding: "5px"}}>
                                <select onChange={e => selectBest("level", e.target.value)}  value={pageSettings.best.level}>
                                    <option value="">-</option>
                                    <option value={pageSettings.translations[0]}>A</option>
                                    <option value={pageSettings.translations[1]}>B</option>
                                    <option value="SAME">Pareil</option>
                                </select>
                            </td>
                        </tr>
                        <tr>
                            <td style={{padding: "5px"}}>
                                <button onClick={() => newQuestion()}>Sauter</button>
                            </td>
                            <td style={{padding: "5px"}}>
                                <button disabled={Object.values(pageSettings.best).filter(b => b === "").length > 0} onClick={() => submit()}>Soumettre</button>
                            </td>
                        </tr>
                        </tbody>
                    </table>
                </>
            }
        </div>
    );
}

export default App;
