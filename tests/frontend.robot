*** Settings ***
Documentation     Suite for testing EduSphere Classroom redesign.
Library           SeleniumLibrary

Suite Setup       Open Web UI
Test Setup        Go To Homepage
Suite Teardown    Close Browser

*** Variables ***
${URL}            http://127.0.0.1:3000

*** Test Cases ***
Login Page Aesthetics
    [Documentation]    Verify login page loads with the new redesign elements.
    Wait Until Page Contains    EduSphere    10s
    Wait Until Page Contains    The modern classroom experience.    10s
    Capture Page Screenshot    login_page.png

*** Keywords ***
Open Web UI
    Open Browser    ${URL}    chrome    options=add_argument("--window-size=1280,720");add_argument("--headless=new")

Go To Homepage
    Go To           ${URL}
    Wait Until Page Contains    EduSphere    10s
