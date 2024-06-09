'use client'
import axios from "axios";
import {  useEffect, useState } from "react";
import OpenAI from 'openai';
import Emailbox from '../Components/Emailbox'
import { useRouter } from "next/navigation";
// Define the interface for email data


export default function Emailclass() {
    const router = useRouter();
    interface Emaildt {
        from:string,
        to:string,
        label: string[];
        subject: string;
        body: string;
    }
    const [selectedValue, setSelectedValue] = useState(10);
    const [emailalldata, setEmailalldata] = useState<Emaildt[]>([]);
    const [classifieddata, setClassifieddata] = useState<string[]>([]);
    const [openai, setOpenai] = useState<any>(null);
    const [displaymail, setDisplaymail] = useState(false);
    const [clickedEmailId, setClickedEmailId] = useState<number>(0);

    // Handle dropdown change
    const handleDropdownChange = (e: any) => {
        setSelectedValue(e.target.value);
    };

    // Fetch OpenAI API key and initialize OpenAI instance
    useEffect(() => {
        const storedKey = localStorage.getItem('openaikey');
        if (storedKey) {
            setOpenai(new OpenAI({
                apiKey: storedKey,
                dangerouslyAllowBrowser: true
            }));
        }
    }, []);

    // Function to handle login
    const fetchmails = () => {
        fetchEmail(selectedValue);
    };

    // Function to fetch and classify emails
    const fetchEmail = async (val: number) => {
        try {
            const resp = await axios.get(`http://localhost:3000/api/v1/emailclassifier/oauth2callback?count=${val}`, {
                withCredentials: true
            });
            const emailData: Emaildt[] = [];
            const classifiedArr: string[] = [];

            // Classify each email
            await Promise.all(resp.data.map(async (dt: any) => {
                const label = dt.labels;
                const subject = dt.subject;
                const bodyenc = dt.body;
                const from = dt.from;
                const to  = dt.to;
                const bodydec = Buffer.from(bodyenc, 'base64').toString('utf-8');
                const completion: any = await openai.completions.create({
                    model: 'gpt-3.5-turbo-instruct',
                    prompt: `Classify the following email subject into one of the following categories: Important, Promotions, Social, Marketing, Spam. Provide only the category name as the response.
                    Email subject: "${subject}"`,
                    max_tokens: 6,
                    temperature: 0.8,
                });

                emailData.push({ from,to,label, subject, body: bodydec});
                classifiedArr.push(completion.choices[0].text.trim());
            }));

            setEmailalldata(emailData);
            setClassifieddata(classifiedArr);
        } catch (error) {
            console.error('Error fetching emails:', error);
        }
    };
    const formatEmailBody = (body:string) => {
        const lines = body.split('\n');
        return openai.completions.create({
            model: 'gpt-3.5-turbo-instruct',
            prompt: `Remove all the links and print the content exactly "${lines}"`,
            max_tokens: 6,
            temperature: 0.8,
        }).then((completion:any) => {
            return completion.choices[0].text.trim();
        }).catch((error:any) => {
            console.error('Error:', error);
            // Handle the error appropriately
        });
    };
    function removeLinks(body: string) {
          const lines = body.split('\n');
          const cleanedLines = lines.map((line) => {
          const urlRegex = /(https?:\/\/[^\s]+)/g;
          return line.replace(urlRegex, '');
  });

  return cleanedLines.join('\n');
  }
//   function displaymails=()=>{

//   }
    // function emailalldet(ind:any){

    //     return(
    //         <div>
             
    //         </div>
    //     )
    // }

    const handleEmailBoxClick = (index: number) => {
        setClickedEmailId(index);
        setDisplaymail(true);
    };

    const closeDialog = () => {
        setClickedEmailId(0);
        setDisplaymail(false);
    };

    return (
        <div>
            <div className="flex items-center p-4 space-x-4 justify-between">
                <div className="flex items-center">
            <img className='rounded-full m-3' src={localStorage.getItem('userpic')!=undefined?localStorage.getItem('userpic')||'':''} alt="image of user"/>
            <h1 className="font-mono text-xl">{localStorage.getItem('username')||''}</h1>
            </div>
            <button className="p-4 border-4 border-slate-50 m-6 rounded-lg hover:bg-white hover:text-black w-36" onClick={()=>{
                router.push('/')
            }}>Log Out</button>
            </div>
            <div className="flex justify-between items-center">
            <div className=" w-60 border-4 rounded-xl m-6">
                <label className="m-2" htmlFor="valueSelect">No of Emails</label>
                <select id="valueSelect" value={selectedValue} onChange={handleDropdownChange} className="border border-gray-300 p-2 bg-black rounded m-4">
                    {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((value) => (
                        <option key={value} value={value}>
                            {value}
                        </option>
                    ))}
                </select>
                </div>
                <div className="p-4 border-4 border-slate-50 m-6 rounded-lg hover:bg-white hover:text-black">
                <button onClick={fetchmails}>Classify Emails</button>
                </div>
            </div>
           
        
            <div className="flex flex-col justify-center items-center " >
                {classifieddata.map((category: string, index: number) =>
                (
                     <div onClick={()=> handleEmailBoxClick(index)} className="border-2 m-5 p-12 w-1/2 border-white rounded-xl flex justify-between hover:bg-white hover:text-black cursor-pointer	">
                    <Emailbox from={emailalldata[index]?.from} body={emailalldata[index]?.body} subject={emailalldata[index]?.subject} classified={category}/>
                    </div>

                ))}
            </div>
            {displaymail ? (
                <div className="fixed inset-0 flex justify-end bg-black bg-opacity-50">
                <div className="bg-black w-1/2 p-6 rounded-lg  h-full">
                    <div className="flex flex-row justify-between p-4 items-start">
                        <div className="text-white w-3/4">
                        <div className="flex flex-row items-center justify-between m-5">
                            <p className="font-medium text-xl p-2">{emailalldata[clickedEmailId]?.from.split('<')[0]}</p>
                            <p className="font-medium text-m p-2 border-2 border-white rounded-xl">{classifieddata[clickedEmailId]}</p>

                        </div>
                            <p>{removeLinks(emailalldata[clickedEmailId]?.body)}</p>
                            
                        </div>
                        <button className="text-white font-extrabold text-2xl" onClick={closeDialog}>X</button>
                    </div>
                </div>
            </div>
            ):null}
        </div>
    );
}
