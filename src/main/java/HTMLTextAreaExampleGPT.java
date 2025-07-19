import javax.swing.*;
public class HTMLTextAreaExampleGPT {
        public static void main(String[] args) {
            // Tworzenie ramki
            JFrame frame = new JFrame("HTML Code Viewer");
            frame.setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
            frame.setSize(400, 300);

            // Kod HTML jako tekst
            String htmlCode = "<html>\n"
                    + "  <head>\n"
                    + "    <title>Example</title>\n"
                    + "  </head>\n"
                    + "  <body>\n"
                    + "    <h1 style=\"color:red;\"><b>Hello World!</b></h1>\n"
                    + "  </body>\n"
                    + "</html>";

            // JTextArea do wyświetlenia kodu HTML
            JTextArea textArea = new JTextArea(htmlCode);
            textArea.setLineWrap(true); // zawijanie wierszy
            textArea.setWrapStyleWord(true); // zawijanie po słowach
            textArea.setEditable(false); // brak możliwości edycji

            // Umieszczenie JTextArea w przewijanym panelu
            JScrollPane scrollPane = new JScrollPane(textArea);

            // Dodanie do ramki
            frame.getContentPane().add(scrollPane);
            frame.setVisible(true);
        }
}
