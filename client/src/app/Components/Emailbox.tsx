'use client'
interface Homeprops{
    from:string,
    to:string,
    subject:string,
    body:string,
    classified:string
}
export default function Home({from,subject,classified,body}:Homeprops){
    let color = "white";
    if(classified=="Important"){
        color = "text-green-400"
    }else if(classified=="Promotions"){
        color = "text-orange-400"
    }else if(classified=='Social'){
        color = "text-blue-400"
    }
    else if(classified=='Marketing'){
        color="text-yellow-400"
    }
    else{
        color="text-red-400";
    }
    
    return(
       <>
            <div className="space-y-2">
            <h1 className="font-bold">{from.split("<")[0]}</h1>
            <h1>{subject}</h1>
            </div>
            <div className="flex flex-col">
            <h1 className={`${color}`}>{classified}</h1>
            </div>
            </>
    )
}