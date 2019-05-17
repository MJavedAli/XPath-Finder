CogniPath 1.0

CogniPath generates unique relative xpath, absolute xpath, cssSelectors, linkText and partialLinkText just by one click. CogniPath can also be used as Editor for selectors. It makes easy to write, edit, extract, and evaluate XPath queries on any webpage. CogniPath also supports iframe, multi selectors generation, generate relative xpath with custom attribute, automation script steps generation and many more.

Please contact Javed Ali, CogniPath Product Evangelist at cert.javed@gmail.com for support.

How to use CogniPath-

1. Right-click on the web page, and then click Inspect.
2. In the right side of Elements tab, click on CogniPath tab.
3. To generate selectors, inspect element or click on any DOM node, it will generate the unique relative XPath/absolute XPath/CSS selector/linkText/partialLinkText. 
4. To evaluate XPath/CSS, type the XPath/CSS query and press enter key.
	As you enter, it will query in DOM for the relevant element/node. You can view the matching node(s) and nodes value as per their sequential occurrence. A green colour outline appears around to highlight the first matching elements and rest in blue colour in the web page.
5. If you mouse hover on any matching node in the CogniPath tab, green/blue dashed outline will convert into dotted orange red to highlight the corresponding element in the webpage.
6. If the found element is not in visible area on webpage then mouse hover on found node in CogniPath panel will scroll that element in the visible area with dotted orange red outline.
7. If found element is not highlighted but visible then on mouse hover on matching node on CogniPath tab it will highlight element with dotted orange red outline.
8. copy the locators just by clicking on copy icon.
9. click on edit icon if want to edit any locator.

Generate Relative xpath with your attribute-
1. Click on setting button which is available in CogniPath tab.
2. In attribute name box, type your attribute value and hit enter. 
3. It will generate the relative xpath with the given attribute if that will be unique else it will try with other attribute and text or parent.
4. If given attribute is not there in the node then it will generate the unique relative xpath with some other attribute.
5. Also for few attributes (id, class, name and placeholder) sort cuts have been provided. If you don't want to generate xpath with any of these attribute, just uncheck them.

Generate Automation code-
1. Click on the set driver command icon (+ icon, beside setting icon) in CogniPath tab.
2. Now when you will generate selectors, it will generate selectors with pre-command like driver.findElement(By.xpath('xpathValue'))  appended in selectors.
3. You can also change these command. Like FindByXpath('xpathValue'). Just have the keyword 'xpathValue' in your command where you want to replace the selector value.
4. Now just by clicking on copy icon you got full automation step.
5. It will add the pre-command only when this is active, if you don't want to add pre-command click on the plus icon again.

Generate selectors in bulk along with label name-
1. Click on the record button in CogniPath tab.
2. Now here just inspect all the elements or click on DOM node for which you want to generate the selectors.
3. It will generate selector along with label name.
4. You can copy, edit, delete any of the row in table.
5. Label and selectors fields are editable, so you can directly edit them there itself.
6. You can also export all the generated selectors, just by clicking Export icon given in the table header in CogniPath tab.
7. At any point of time if you want to stop recording and go back to default view, just click on record button again. This will not remove your recorded selectors but if you will close the devtool then you will loose them.
8. Also you can stop recording at anytime just by clicking on ON/OFF button.
9. Every time when you will open devtool and then CogniPath, it will be fresh window. 

Get selectors and editor both the options in single selector view-
1. If you want to work with any particular selector like Rel XPath only, then change the selectors drop down value to Rel XPath.
2. Here you will get Rel XPath as in separate row like default view and editor box empty to use CogniPath as editor in the same time.

UI features-
1. Now CogniPath gives the colored relative xpath.
2. Delete option in place of delete one by one.

iframe feature-
*Supports only those iframe which has the same src. 
1. If element inside iframe, then it will highlight first matching element in orange dotted outline.
2. It will also add one 'if..' icon in input box of CogniPath tab to make it clear that element is inside iframe.
3. If you want to verify your selector inside iframe then 1st inspect any element inside that iframe so that it get the DOM of iframe and then verify the selector.
4. Again if you want to verify any selector for a element which is outside iframe then first inspect any element which is outside iframe so that it get the top DOM and then verify the selector.

Dynamic ID support-
1. To generate relative xpath without id, uncheck the checkbox there in relative xpath row.
2. To generate relative xpath with id, select the checkbox.

On/Off button-
1. If you don't want to generate selectors, turn off the button available in CogniPath tab.
2. Turn on the button to enable CogniPath again.

Dark Theme-
1. To use dark theme, go to devtools settings.
2. Change the Theme from Light to Dark.

Note: 
1. For one selector only, change the dropdown value from selectors to rel XPath/abs Xpath/CSS sel in header.
2. Tool will add xpath/css attribute to all the matching node(s) as per their sequential occurrence. For example, a matching node appearing second in the list will have xpath=2. And if verifying CSS then it will add css=2.
3. Supports only those iframe which has the same src.
