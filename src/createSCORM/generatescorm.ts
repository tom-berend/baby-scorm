// we are building a SINGLE SCO, with complex navigation contained with
// launchpage is 'shared/laun

import { Runtime } from "../runtime/runtime"




class generateScormPackage {

    courseIdentification = 'Writing Computer Games'
    organization = 'CommunityReading_Org'
    title = 'Writing Computer Games'
    launchPage = 'shared/launchpage.html'

    // in the root of the ZIP, we have these FIVE files, 
    //      plus a folder for each course with content (.json, .jpg, .png)
    //      plus a folder 'shared' with runtime .js and navigation .json

    // imsmd_rootv1p2p1.xsd  does not change
    // adlcp_rootv1p2.xsd    does not change
    // imsmd_rootv1p2p1.xsd  does not change
    // ims_xml.xsd           does not change

    // imsmanifest.xml       must be created every time 


    genImsmanifestxml():string {
        let xml =

            `<!--  this package targets SCORM 1.2.    Big thanks to Rustici Software - http://www.scorm.com -->
<manifest xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" 
        xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2" 
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
        identifier="${this.courseIdentification}" 
        version="1" 
        xsi:schemaLocation="http://www.imsproject.org/xsd/imscp_rootv1p1p2 
            imscp_rootv1p1p2.xsd http://www.imsglobal.org/xsd/imsmd_rootv1p2p1 
            imsmd_rootv1p2p1.xsd http://www.adlnet.org/xsd/adlcp_rootv1p2 
            adlcp_rootv1p2.xsd">

    <metadata>
        <schema>ADL SCORM</schema>
        <schemaversion>1.2</schemaversion>
    </metadata>

    <organizations default="${this.organization}">
        <organization identifier="${this.organization}">
            <title>${this.title}</title>
            <item identifier="item_1" identifierref="resource_1">
                <title>${this.title}</title>
            </item>
        </organization>
    </organizations>

    <resources>
        <resource identifier="resource_1" type="webcontent" adlcp:scormtype="sco" href="${this.launchpage}">
        `

        // now add every file

        // <file href="Etiquette/Course.html"/>
        // <file href="Etiquette/course.jpg"/>
        // <file href="Etiquette/Distracting.html"/>
        //             :

        xml += `
        </resource>
    </resources>
</manifest>
`
        return (xml)
    }

}
